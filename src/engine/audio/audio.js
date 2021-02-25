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
    this.musicSources = [];
    // A number of positional audio sources.
    this.positionalAudioSources = [];

    // Audio library.
    const library = SFXLibrary;
    this.source = null;
    this.sounds = {
        sfx: library.global.map(i => i[1]), // [1] === urls
        positionalSfx: library.positional.map(i => i[1]),
        music: library.music.map(i => i[1])
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
    this.musicMap = new Map(
        library.music.map((i, index) =>
            [i[0], index] // [0] === name, index === in sources array
        )
    );
    this.isMusicMute = false;

    // Loading.
    this.nbSoundsToLoad = this.sounds.sfx.length +
        this.sounds.music.length +
        this.sounds.positionalSfx.length;
    this.nbSoundsLoadedOrError = 0;

    // Notes generator
    this.notesEngine = new Notes(this);

    // misc
    this.waterFootstep = 0;
    this.nbWaterFootsteps = 4;
    this.footstep = 0;
    this.nbFootsteps = 8;
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
        this.loadAudios(tunes, true, true);
        this.loadAudios(psfxs, false);
    },

    loadAudios(lib, isGlobal, isMusic)
    {
        const globalListener = this.listener;
        const defaultVolume = this.settings.globalVolume;
        const loadingState = this.app.state.getState('loading');
        lib.forEach((sfx, id) =>
        {
            this.audioLoader.load(sfx,  buffer =>
            {
                const audio = isGlobal ?
                    new Audio(globalListener) :
                    new PositionalAudio(globalListener);
                audio.setBuffer(buffer);
                audio.setVolume(defaultVolume);
                // force volume to 0
                audio.gain.gain.setValueAtTime(0.00001,
                    globalListener.context.currentTime
                );
                isMusic ? this.musicSources[id] = audio :
                    isGlobal ?
                        this.audioSources[id] = audio :
                        this.positionalAudioSources[id] = audio;
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
        const m = this.musicSources;
        a.forEach(s => s.setVolume(0));
        p.forEach(s => s.setVolume(0));
        m.forEach(s => s.setVolume(0));
        this.notesEngine.mainVoiceMaxVolume = 0;
        this.notesEngine.mainVoice.setVolume(0);
    },

    unMute()
    {
        this.settings.mute = false;
        const p = this.positionalAudioSources;
        const a = this.audioSources;
        const m = this.musicSources;
        const volume = this.settings.globalVolume;
        a.forEach(s => s.setVolume(volume));
        p.forEach(s => s.setVolume(volume));
        m.forEach(s => s.setVolume(volume));
    },

    playMusic()
    {
        const i1 = this.musicMap.get('ambience-1');
        const i2 = this.musicMap.get('ambience-2');
        const i3 = this.musicMap.get('ambience-3');
        const i4 = this.musicMap.get('ambience-4');
        const a1 = this.musicSources[i1];
        const a2 = this.musicSources[i2];
        const a3 = this.musicSources[i3];
        const a4 = this.musicSources[i4];
        a1.currentTime = 0;
        a1.onEnded = () => {
            a1.isPlaying = false;
            a2.isPlaying = false;
            a2.currentTime = 0;
            a2.play();
        };
        a2.onEnded = () => {
            a2.isPlaying = false;
            a3.isPlaying = false;
            a3.currentTime = 0;
            a3.play();
        };
        a3.onEnded = () => {
            a3.isPlaying = false;
            a4.isPlaying = false;
            a4.currentTime = 0;
            a4.play();
        };
        a4.onEnded = () => {
            a4.isPlaying = false;
            a1.isPlaying = false;
            a1.currentTime = 0;
            a1.play();
        };
        a1.play();
    },

    muteMusic()
    {
        this.isMusicMute = true;
        const m = this.musicSources;
        m.forEach(s => s.setVolume(0));
    },

    unmuteMusic()
    {
        this.isMusicMute = false;
        const m = this.musicSources;
        const volume = this.settings.globalVolume;
        m.forEach(s => s.setVolume(volume));
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
        const m = this.musicSources;
        a.forEach(s => s.setVolume(volume));
        p.forEach(s => s.setVolume(volume));
        m.forEach(s => s.setVolume(volume));
        this.notesEngine.mainVoiceMaxVolume = volume / 2;
        // ^  this can be annoying so…
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

    playJumpSound()
    {
        this.playMusic();
        // TODO
        console.log('jump');
        this.playMenuSound();
    },

    playFootstepWaterSound()
    {
        // TODO
        console.log('water');
        this.playMenuSound();
    },

    playFootstepSound()
    {
        // TODO bind footstep
        console.log('ground');
        this.playMenuSound();
    },

    playMenuSound()
    {
        this._resume();
        const audioIndex = this.soundMap.get('menu');
        const menuAudio = this.audioSources[audioIndex];
        menuAudio.play();
    },

    playTextFromPosition(text, position)
    {
        this.playText(text);
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
