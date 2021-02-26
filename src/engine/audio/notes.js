/**
 * Generating, aggregating notes.
 */

'use strict';

import extend, { assert }      from '../../extend';

import { AlphabetFrequencies } from './frequencies';
import { Audio }               from 'three';

let Notes = function(audio)
{
    this.audioEngine = audio;

    // oscillators array
    this.notes = [];
    this.currentlyPlayinNotes = [];

    // note name to note frequency
    this.frequencies = AlphabetFrequencies;

    // (positional) audio -> text (cut to the current singing position)
    this.whoSingsWhat = new Map();

    // main singer
    this.singingHandle = 0;

    this.mainVoiceMaxVolume = 0.0;
    this.mainVoice = null;
    this.mainOscillator = null;

    // hack to fix an extremely annoying FF bug
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1171438
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

extend(Notes.prototype, {

    generateHandle()
    {
        return this.singingHandle + 1;
    },

    refresh()
    {

    },

    isReady()
    {
        return this.mainVoice !== null;
    },

    getMainVoice()
    {
        return this.mainVoice;
    },

    generateMainVoice(listener)
    {
        assert(this.frequencies.size > 0, '[Audio/Notes] Could not find notes.');

        const voice = new Audio(listener);
        const audioContext = listener.context;
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        const currentTime = voice.context.currentTime;
        oscillator.frequency.setValueAtTime(144, currentTime);
        oscillator.start(0);
        voice.setNodeSource(oscillator);

        const volume = this.mainVoiceMaxVolume;
        voice.setVolume(volume);
        // ^ this uses gain.setTargetAtTime() with a delta, which does render a sound
        voice.gain.gain.setValueAtTime(volume, currentTime);
        // ^ so we need to enforce the initial volume this way

        this.mainVoice = voice;
        this.mainOscillator = oscillator;
    },

    singLetter(letter, threeAudio, listener,
        textRemainder // CAUTION this argument should not be set except for the menu test.
    )
    {
        const howToSing = this.frequencies.get(letter);
        if (!howToSing)
        {
            console.error(`[Audio] ${letter} not found.`);
            return;
        }

        const frequency = howToSing[0];
        const sustain = howToSing[1];
        const sustainFactor = 1e3 * 0.5;

        const audioContext = listener.context;
        const currentTime = audioContext.currentTime;
        this.mainOscillator.frequency.setValueAtTime(frequency, currentTime);

        if (textRemainder && textRemainder.length)
        {
            const singingHandle = this.generateHandle();
            this.singingHandle = singingHandle;
            setTimeout(() =>
            {
                this.mainVoice.setVolume(this.mainVoiceMaxVolume);
                this.singRemainingText(textRemainder, threeAudio, listener, singingHandle);
            }, sustain * sustainFactor
            );
        }
        else
        {
            setTimeout(() =>
            {
                this.mainVoice.setVolume(0.);
                this.fadeOutVolumeIfFirefox(audioContext);
            }, sustain * sustainFactor);
        }
    },

    singText(text, threeAudio, listener)
    {
        let cleanedText = text
            .replace(/[^a-zA-Z\s]/gi, '') // remove non alphabetic
            // .trim() // remove trailing spaces
            .toLowerCase()
            .replace(/\s+/g, ' '); // reduce spaces

        // it’s extremely annoying, so limiting to 10 notes.
        if (cleanedText.length > 10)
            cleanedText = cleanedText.substring(0, 10);

        const firstLetter = cleanedText[0];
        cleanedText = cleanedText.substring(1);
        const wsw = this.whoSingsWhat;
        wsw.set(threeAudio, cleanedText); // remainder of the text

        this.fadeInVolumeIfFirefox(this.mainVoiceMaxVolume, listener.context);
        if (!this.isFirefox)
            this.mainVoice.setVolume(this.mainVoiceMaxVolume);

        this.singLetter(firstLetter, threeAudio, listener,
            // CAUTION this last argument is passed only
            // to setup a chain in the menu (where animationFrame is not available)
            cleanedText);
    },

    // this is for R&D
    singRemainingText(text, threeAudio, listener, singingHandle)
    {
        if (this.singingHandle !== singingHandle)
        {
            this.mainVoice.setVolume(0.);
            return;
        }

        const letter = text[0];
        const remainder = text.substring(1);

        const howToSing = this.frequencies.get(letter);
        const frequency = howToSing[0];
        const sustain = howToSing[1];

        const audioContext = listener.context;
        const currentTime = audioContext.currentTime;

        this.mainOscillator.frequency.setValueAtTime(frequency, currentTime);

        if (remainder && remainder.length)
        {
            this.whoSingsWhat.set(threeAudio, remainder);
            setTimeout(() =>
            {
                this.mainVoice.setVolume(this.mainVoiceMaxVolume);
                this.singRemainingText(remainder, threeAudio, listener, singingHandle);
            }, sustain * 1e3
            );
        }
        else
        {
            setTimeout(() =>
            {
                this.mainVoice.setVolume(0.);
                this.fadeOutVolumeIfFirefox(audioContext);
            }, sustain * 1e3);
        }
    },

    // https://bugzilla.mozilla.org/show_bug.cgi?id=1171438
    fadeInVolumeIfFirefox(volume, audioContext)
    {
        if (!this.isFirefox) return;
        const gain = this.mainVoice.gain;
        const ct = audioContext.currentTime;
        const maxV = this.audioEngine.settings.globalVolume;
        gain.gain.setValueAtTime(0, ct);
        gain.gain.linearRampToValueAtTime(maxV, ct + .05);
    },

    fadeOutVolumeIfFirefox(audioContext)
    {
        if (!this.isFirefox) return;
        const gain = this.mainVoice.gain;
        const ct = audioContext.currentTime;
        const maxV = this.audioEngine.settings.globalVolume;
        gain.gain.setValueAtTime(maxV, ct);
        gain.gain.linearRampToValueAtTime(0, ct + .05);
    }

});

export { Notes };

