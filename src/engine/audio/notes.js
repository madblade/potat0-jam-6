/**
 * Generating, aggregating notes.
 */

import extend, { assert }      from '../../extend';
import { AlphabetFrequencies } from './frequencies';

let Notes = function()
{
    // oscillators array
    this.notes = [];
    this.currentlyPlayinNotes = [];

    // note name to note frequency
    this.frequencies = AlphabetFrequencies;

    // letter to index of note in oscillators array
    this.alphabet = new Map();

    // (positional) audio -> text (cut to the current singing position)
    this.whoSingsWhat = new Map();

    this.notesReady = false;
};

extend(Notes.prototype, {

    refresh()
    {

    },

    isReady()
    {
        return this.notesReady;
    },

    generateAllNotes(listener)
    {
        assert(this.frequencies.size > 0, '[Audio/Notes] Could not find notes.');
        const alphabet = this.alphabet;
        this.frequencies.forEach((howToSingIt, letterName) => {
            const frequency = howToSingIt[0];
            const sustainTime = howToSingIt[1];
            const note1 = this.generateNote(frequency, listener);
            const note2 = this.generateNote(frequency, listener);
            const note3 = this.generateNote(frequency, listener);
            const note4 = this.generateNote(frequency, listener);
            const note5 = this.generateNote(frequency, listener);
            const lastNoteIndex = 0;
            alphabet.set(letterName, [sustainTime, note1, note2, note3, note4, note5, lastNoteIndex]);
        });
    },

    generateNote(frequency, listener)
    {
        assert(typeof frequency === 'number', '[Audio/Notes] Invalid frequency.');
        const audioContext = listener.context;
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        return oscillator;
    },

    singLetter(letter, threeAudio, listener,
        textRemainder // CAUTION this argument should not be set except for the menu test.
    )
    {
        const howToSing = this.alphabet.get(letter);
        if (!howToSing)
        {
            console.error(`[Audio] ${letter} not found.`);
            return;
        }

        const sustain = howToSing[0];
        let lastNoteIndex = howToSing[6];
        const note1 = howToSing[1 + lastNoteIndex];
        lastNoteIndex += 1; lastNoteIndex %= 5;
        howToSing[6] = lastNoteIndex;

        const audioContext = listener.context;
        const gain = audioContext.createGain();
        note1.connect(gain);
        const currentTime = audioContext.currentTime; // should this be 0?
        gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + sustain); // 0.04
        gain.connect(audioContext.destination);

        try {
            note1.start(0);
        } catch (e) {
            return;
        }
        // note.stop(currentTime + sustain);

        if (textRemainder && textRemainder.length)
            setTimeout(() =>
                this.singRemainingText(textRemainder, threeAudio, listener), sustain * 1e3 / 2
            );
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

        this.singLetter(firstLetter, threeAudio, listener,
            // CAUTION this last argument is passed only
            // to setup a chain in the menu (where animationFrame is not available)
            cleanedText);
    },

    singRemainingText(text, threeAudio, listener)
    {
        const letter = text[0];
        const remainder = text.substring(1);

        const howToSing = this.alphabet.get(letter);
        const sustain = howToSing[0];
        let lastNoteIndex = howToSing[6];
        const note1 = howToSing[1 + lastNoteIndex];
        lastNoteIndex += 1; lastNoteIndex %= 5;
        howToSing[6] = lastNoteIndex;

        const audioContext = listener.context;
        const gain = audioContext.createGain();
        note1.connect(gain);
        const currentTime = audioContext.currentTime; // should this be 0?
        gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + sustain);
        gain.connect(audioContext.destination);

        try {
            note1.start(0);
        } catch (e) {
            return;
        }

        if (remainder && remainder.length)
        {
            this.whoSingsWhat.set(threeAudio, remainder);
            setTimeout(() =>
                this.singRemainingText(remainder, threeAudio, listener), sustain * 1e3 / 2
            );
        }
    }

});

export { Notes };

