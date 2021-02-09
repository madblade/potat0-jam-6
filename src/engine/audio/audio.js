/**
 * Manages SFX, music, volume.
 */

'use strict';

import extend, { assert } from '../../extend.js';
import {
    Audio,
    AudioListener,
    AudioLoader, PositionalAudio,
}                         from 'three';


// Sounds
import SelectSound     from '../../assets/audio/menu.select.wav';

let AudioEngine = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {
        volume: 0.5
    };

    // Three audio engine.
    // A global listener, to be attached to a camera.
    this.listener = new AudioListener();
    // A number of global audio sources.
    this.audioSources = [];
    // A number of positional audio sources.
    this.positionalAudioSources = [];

    // Audio library.
    this.source = null;
    this.sounds = {
        sfx: [SelectSound],
        positionalSfx: [],
        music: []
    };
    // Sound name -> index of sound in audioSources array
    this.soundMap = new Map([
        ['menu', 0]
    ]);
    this.positionalSoundMap = new Map([
        ['footstep', 0]
    ]);

    // Loading.
    this.nbSoundsToLoad = this.sounds.sfx.length +
        this.sounds.music.length +
        this.sounds.positionalSfx.length;
    this.nbSoundsLoadedOrError = 0;
};

extend(AudioEngine.prototype, {

    preload(loadingManager)
    {
        // Load audio objects.
        this.audioLoader = new AudioLoader(loadingManager);

        const sfxs = this.sounds.sfx;
        const psfxs = this.sounds.positionalSfx;
        const tunes = this.sounds.music;

        const defaultVolume = this.settings.volume;
        const globalListener = this.listener;
        sfxs.forEach(sfx =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = new Audio(globalListener);
                audio.setBuffer(buffer);
                audio.setVolume(defaultVolume);
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
                audio.setVolume(defaultVolume);
                this.audioSources.push(audio);
                this.nbSoundsLoadedOrError++;
            }, null, error => {
                console.error(error);
                this.nbSoundsLoadedOrError++;
            });
        });
        psfxs.forEach(sfx =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = new PositionalAudio(globalListener);
                // TODO positional listener.
                audio.setBuffer(buffer);
                audio.setVolume(defaultVolume);
                this.positionalAudioSources.push(audio);
                this.nbSoundsLoadedOrError++;
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
        assert(typeof volume === 'number' && volume <= 1. && volume >= 0.,
            '[Audio] Invalid volume.');
        this.settings.globalVolume = volume;
        const p = this.positionalAudioSources;
        const a = this.audioSources;
        a.forEach(s => s.setVolume(volume));
        p.forEach(s => s.setVolume(volume));
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
    }

});

export { AudioEngine };
