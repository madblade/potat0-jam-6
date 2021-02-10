/**
 * Generating, aggregating notes.
 */

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
            }, sustain * 1e3
            );
        }
        else
        {
            setTimeout(() =>
            {
                this.mainVoice.setVolume(0.);
                this.isSingingInMenu = false;
            }, sustain * 1e3);
        }
    },

    singText(text, threeAudio, listener)
    {
        let cleanedText = text
            .replace(/[^a-zA-Z\s]/gi, '') // remove non alphabetic
            .trim() // remove trailing spaces
            .toLowerCase()
            .replace(/\s+/g, ' '); // reduce spaces

        const firstLetter = cleanedText[0];
        cleanedText = cleanedText.substring(1);
        const wsw = this.whoSingsWhat;
        wsw.set(threeAudio, cleanedText); // remainder of the text

        this.mainVoice.setVolume(this.mainVoiceMaxVolume);
        this.singLetter(firstLetter, threeAudio, listener,
            // CAUTION this last argument is passed only
            // to setup a chain in the menu (where animationFrame is not available)
            cleanedText);
    },

    // this is for R&D
    singRemainingText(text, threeAudio, listener, singingHandle)
    {
        if (this.singingHandle !== singingHandle) return;

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
            }, sustain * 1e3);
        }
    }

});

export { Notes };

