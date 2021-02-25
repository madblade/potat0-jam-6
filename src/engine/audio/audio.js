/**
 * Manages SFX, music, volume.
 */

'use strict';

import extend, { assert }   from '../../extend';

import { Notes }            from './notes';
import { SFXLibrary }       from './library';
import {
    Audio,
    AudioListener,
    AudioLoader,
    PositionalAudio,
}                           from 'three';

let AudioEngine = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {
        globalVolume: 0.,
        mute: true,
    };

    // Three audio engine.
    // A global listener, to be attached to a camera.
    this.listener = new AudioListener();
    // A number of global audio sources.
    this.audioSources = [];
    // A number of positional audio sources.
    this.positionalAudioSources = [];

    // Audio library.
    const library = SFXLibrary;
    this.source = null;
    this.sounds = {
        sfx: library.global.map(i => i[1]), // [1] === urls
        positionalSfx: library.positional.map(i => i[1]),
        music: []
    };
    // Sound name -> index of sound in audioSources array
    this.soundMap = new Map(
        library.global.map((i, index) =>
            [i[0], index] // [0] === name, index === in sources array
        )
    );
    this.positionalSoundMap = new Map(
        library.positional.map((i, index) =>
            [i[0], index]
        )
    );

    // Loading.
    this.nbSoundsToLoad = this.sounds.sfx.length +
        this.sounds.music.length +
        this.sounds.positionalSfx.length;
    this.nbSoundsLoadedOrError = 0;

    // Notes generator
    this.notesEngine = new Notes(this);
};

extend(AudioEngine.prototype, {

    refresh()
    {
        this.notesEngine.refresh();
    },

    preload(loadingManager)
    {
        // Load audio objects.
        this.audioLoader = new AudioLoader(loadingManager);

        const sfxs = this.sounds.sfx;
        const psfxs = this.sounds.positionalSfx;
        const tunes = this.sounds.music;

        this.loadAudios(sfxs, true);
        this.loadAudios(tunes, true);
        this.loadAudios(psfxs, false);
    },

    loadAudios(lib, isGlobal)
    {
        const globalListener = this.listener;
        const defaultVolume = this.settings.globalVolume;
        const loadingState = this.app.state.getState('loading');
        lib.forEach(sfx =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = isGlobal ?
                    new Audio(globalListener) :
                    new PositionalAudio(globalListener);
                audio.setBuffer(buffer);
                audio.setVolume(defaultVolume);
                // force volume to 0
                audio.gain.gain.setValueAtTime(0.00001, globalListener.context.currentTime);
                isGlobal ?
                    this.audioSources.push(audio) :
                    this.positionalAudioSources.push(audio);
                this.nbSoundsLoadedOrError++;
            }, () => {
                loadingState.notifyTaskName('audio');
            }, error => {
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

    isMute()
    {
        return this.settings.mute;
    },

    mute()
    {
        this.settings.mute = true;
        const p = this.positionalAudioSources;
        const a = this.audioSources;
        a.forEach(s => s.setVolume(0));
        p.forEach(s => s.setVolume(0));
        this.notesEngine.mainVoiceMaxVolume = 0;
        this.notesEngine.mainVoice.setVolume(0);
    },

    unMute()
    {
        this.settings.mute = false;
        const p = this.positionalAudioSources;
        const a = this.audioSources;
        const volume = this.settings.globalVolume;
        a.forEach(s => s.setVolume(volume));
        p.forEach(s => s.setVolume(volume));
    },

    muteMusic()
    {
        // TODO
    },

    unmuteMusic()
    {
        // TODO
    },

    setVolume(volume) // volume should be in [0, 1]
    {
        // console.log(`Setting volume ${volume}.`);
        assert(typeof volume === 'number' && volume <= 1. && volume >= 0.,
            '[Audio] Invalid volume.');

        this.settings.mute = volume === 0;
        this.settings.globalVolume = volume;
        const p = this.positionalAudioSources;
        const a = this.audioSources;
        a.forEach(s => s.setVolume(volume));
        p.forEach(s => s.setVolume(volume));
        this.notesEngine.mainVoiceMaxVolume = volume;
    },

    getVolume()
    {
        return this.settings.globalVolume;
    },

    playValidateSound()
    {
        // this._resume();
        // const audioIndex = this.soundMap.get('validate');
        // const validateAudio = this.audioSources[audioIndex];
        // validateAudio.play();
    },

    playFootstepSound()
    {
        // TODO bind footstep
        this.playMenuSound();
    },

    playMenuSound()
    {
        this._resume();
        const audioIndex = this.soundMap.get('menu');
        const menuAudio = this.audioSources[audioIndex];
        menuAudio.play();
    },

    playText(text, audioSource)
    {
        assert(typeof text === 'string' && text.length < 3000, '[Audio] Text too long.');

        const listener = this.listener;
        const notesEngine = this.notesEngine;

        if (!notesEngine.isReady())
            notesEngine.generateMainVoice(listener);

        if (!audioSource)
        {
            audioSource = notesEngine.getMainVoice();
        }

        notesEngine.singText(text, audioSource, listener);
    },

    run()
    {
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
