/**
 * All audio files
 */

// music
import EasyTime             from '../../assets/audio/music/1_easy_time.mp3';
import PompeJoyeuse         from '../../assets/audio/music/2_pompe_joyeuse.mp3';
import PompeMelancolique    from '../../assets/audio/music/3_pompe_melancolique.mp3';
import ValseManouche        from '../../assets/audio/music/4_valse_manouche.mp3';
import LesYeuxNoirs         from '../../assets/audio/music/5_les_yeux_noirs.mp3';

// sfx global
import SelectSound          from '../../assets/audio/menu.select.wav';
import PickupSound          from '../../assets/audio/pickup.wav';

// sfx local
import JumpSound            from '../../assets/audio/movement/jump.mp3';
import FootStepHard1        from '../../assets/audio/movement/footstep-hard-1.mp3';
import FootStepHard2        from '../../assets/audio/movement/footstep-hard-2.mp3';
import FootStepHard3        from '../../assets/audio/movement/footstep-hard-3.mp3';
import FootStepHard4        from '../../assets/audio/movement/footstep-hard-4.mp3';
import FootStepHard5        from '../../assets/audio/movement/footstep-hard-5.mp3';
import FootStepHard6        from '../../assets/audio/movement/footstep-hard-6.mp3';
import FootStepHard7        from '../../assets/audio/movement/footstep-hard-7.mp3';
import FootStepHard8        from '../../assets/audio/movement/footstep-hard-8.mp3';
import FootStepDirt1        from '../../assets/audio/movement/footstep-dirt-1.mp3';
import FootStepDirt2        from '../../assets/audio/movement/footstep-dirt-2.mp3';
import FootStepDirt3        from '../../assets/audio/movement/footstep-dirt-3.mp3';
import FootStepPuddle1      from '../../assets/audio/movement/footstep-puddle-1.mp3';
import FootStepPuddle2      from '../../assets/audio/movement/footstep-puddle-2.mp3';
import FootStepPuddle3      from '../../assets/audio/movement/footstep-puddle-3.mp3';
import FootStepPuddle4      from '../../assets/audio/movement/footstep-puddle-4.mp3';

const SFXLibrary = {

    global: [
        ['menu', SelectSound],
        ['pickup', PickupSound],
    ],

    music: [
        ['ambience-1', EasyTime],
        ['ambience-2', PompeJoyeuse],
        ['ambience-3', PompeMelancolique],
        ['ambience-4', ValseManouche],
        ['credits', LesYeuxNoirs],
    ],

    positional: [
        ['footstep-hard-1', FootStepHard1],
        ['footstep-hard-2', FootStepHard2],
        ['footstep-hard-3', FootStepHard3],
        ['footstep-hard-4', FootStepHard4],
        ['footstep-hard-5', FootStepHard5],
        ['footstep-hard-6', FootStepHard6],
        ['footstep-hard-7', FootStepHard7],
        ['footstep-hard-8', FootStepHard8],

        ['footstep-dirt-1', FootStepDirt1],
        ['footstep-dirt-2', FootStepDirt2],
        ['footstep-dirt-3', FootStepDirt3],

        ['footstep-puddle-1', FootStepPuddle1],
        ['footstep-puddle-2', FootStepPuddle2],
        ['footstep-puddle-3', FootStepPuddle3],
        ['footstep-puddle-4', FootStepPuddle4],

        ['jump', JumpSound],
    ],

};

export { SFXLibrary };
