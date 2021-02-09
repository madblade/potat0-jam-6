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
        this.frequencies.forEach((frequency, letterName) => {
            const note = this.generateNote(frequency, listener);
            alphabet.set(letterName, note);
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

    singLetter(letter, threeAudio, listener)
    {
        const note = this.alphabet.get(letter);
        if (!note)
        {
            console.error(`[Audio] ${letter} not found.`);
            return;
        }

        const audioContext = listener.context;
        const gain = audioContext.createGain();
        note.connect(gain);
        const currentTime = audioContext.currentTime; // should this be 0?
        gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 1.); // 0.04
        gain.connect(audioContext.destination);

        threeAudio.setNodeSource(gain);
        note.start(0);
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

        this.singLetter(firstLetter, threeAudio, listener);
    }

});

export { Notes };

