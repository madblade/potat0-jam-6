/**
 * Manages SFX, music, volume.
 */

'use strict';

import extend          from '../../extend.js';
import {
    Audio,
    AudioListener,
    AudioLoader,
} from 'three';


// Sounds
import SelectSound     from '../../assets/audio/menu.select.wav';

let AudioEngine = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    // Three audio engine.
    // A global listener, to be attached to a camera.
    this.listener = new AudioListener();
    // A number of audio sources.
    this.audioSources = [];

    // Audio library.
    this.source = null;
    this.sounds = {
        sfx: [SelectSound],
        music: []
    };
    // Sound name -> index of sound in audioSources array
    this.soundMap = new Map([
        ['menu', 0]
    ]);

    // Loading.
    this.nbSoundsToLoad = this.sounds.sfx.length + this.sounds.music.length;
    this.nbSoundsLoadedOrError = 0;
};

extend(AudioEngine.prototype, {

    preload(loadingManager)
    {
        // Load audio objects.
        this.audioLoader = new AudioLoader(loadingManager);

        const sfxs = this.sounds.sfx;
        const tunes = this.sounds.music;

        const globalListener = this.listener;
        sfxs.forEach(sfx =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = new Audio(globalListener);
                audio.setBuffer(buffer);
                audio.setVolume(0.5);
                this.audioSources.push(audio);
                this.nbSoundsLoadedOrError++;
            }, null, error => {
                console.error(error);
                this.nbSoundsLoadedOrError++;
            });
        });
        tunes.forEach(sfx =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = new Audio(globalListener);
                audio.setBuffer(buffer);
                audio.setVolume(0.5);
                this.audioSources.push(audio);
            }, null, error => {
                console.error(error);
                this.nbSoundsLoadedOrError++;
            });
        });
    },

    _resume()
    {
        this.listener.context.resume();
    },

    isDoneLoadingSounds()
    {
        return this.nbSoundsLoadedOrError >= this.nbSoundsToLoad;
    },

    setVolume(volume) // volume should be in [0, 1]
    {
        console.log(`Setting volume ${volume}.`);
    },

    playMenuSound()
    {
        this._resume();
        const audioIndex = this.soundMap.get('menu');
        const menuAudio = this.audioSources[audioIndex];
        menuAudio.play();
    },

    run()
    {
        // TODO bind audio of object to camera.
    },

    stop()
    {
        this.stopAllSounds();
    },

    stopAllSounds()
    {
        let sounds = this.sounds;
        sounds.all.forEach(function(sound) {
            if (sounds[sound].source !== null && sounds[sound].playing) {
                sounds[sound].source.stop();
                sounds[sound].playing = false;
            }
        });
    }

});

export { AudioEngine };
