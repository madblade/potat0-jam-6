/**
 * Audio settings menu.
 */

'use strict';

import extend, { inherit }  from '../../extend';

import { $ }                from '../../modules/polyfills/dom';

import { GamepadNavigable } from '../../modules/navigation/navigable.gamepad';

let AudioMenu = function(settingsModule)
{
    const nbNavigableObjects = 2;
    GamepadNavigable.call(this, nbNavigableObjects);

    this.settingsModule = settingsModule;
};

inherit(AudioMenu, GamepadNavigable);

extend(AudioMenu.prototype, {

    getHTML()
    {
        const ga = this.settingsModule.gamepadActive;
        const ai = this.activeItem;
        const audio = this.settingsModule.app.engine.audio;
        const isMusicMute = audio.isMusicMute;

        let content = `
            <div class="container">
            <table class="table table border rounded noselect" style="width:100%">
                <tr><td colspan="2" id="settings-audio-volume">
                <div class="row mt-3" id="settings-inner-audio-volume">
                    <div class="col-4"></div>
                    <div id="volume-control-wrapper"
                        class="input-group mb-1 center-block col-4 slider-container ${this.hl(ga, ai, 0)}">
                        <div class="col-2" id="volume-status"><i class="fas fa-volume-mute fa-2x"></i></div>
                        <div class="col-10 input-group-append flex-fill">
                            <input type="range" min="0" max="100" value="0" class="slider"
                                id="main-volume-controller">
                        </div>
                    </div>
                </div>
                </td></tr>

                <tr>
                <td>Musique</td>
                <td>
                    <label class="w3switch">
                        <input type="checkbox" id="switch-music" ${isMusicMute ? '' : 'checked'}>
                        <span class="w3slider w3round"></span>
                    </label>
                </td>
                </tr>

                <!-- <tr>-->
                <!-- <td>Effets</td>-->
                <!-- <td>-->
                <!--     <label class="w3switch">-->
                <!--         <input type="checkbox" id="switch-effects">-->
                <!--         <span class="w3slider w3round"></span>-->
                <!--     </label>-->
                <!-- </td>-->
                <!-- </tr>-->

                <tr id="return"><td colspan="2">Retour</td></tr>
        `;

        // for (let s in audioSettings) {
        //     content += `<tr><td>${audioSettings[s]}</td></tr>`;
        // }

        content += `
            </table>
            </div>`;
        return content;
    },

    hl(ga, ai, i) // highlight
    {
        return ga && ai === i ? 'gamepad-selected' : '';
    },

    listen()
    {
        this.listenReturn();
        this.startVolumeController();
    },

    listenReturn()
    {
        const sm = this.settingsModule;
        $('#return').click(() => {
            sm.switchToMenu(sm.homeMenu);
        });
    },

    unlisten()
    {
        $('#return').off('click');
        this.stopVolumeController();
    },

    startVolumeController()
    {
        const app = this.settingsModule.app;
        const audio = app.engine.audio;

        // Init control graphics from model.
        const iconVolume = $('#volume-status');
        const volumeControl = $('#main-volume-controller');
        const v = Math.floor(audio.getVolume() * 100);
        volumeControl.val(v);
        if (v === 0 || audio.isMute())
            iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
        else
            iconVolume.html('<i class="fas fa-volume-up fa-2x">');

        // Listen to volume control.
        volumeControl.on('input change', i => {
            const newVolume = parseInt(i.target.value, 10);
            audio.setVolume(newVolume / 100);
            if (newVolume === 0)
                iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
            else
                iconVolume.html('<i class="fas fa-volume-up fa-2x">');
        });
        volumeControl.change(() => {
            audio.playText(' Cxy');
        });
        iconVolume.click(() => {
            const isMute = audio.isMute();
            if (isMute)
            {
                const newV = Math.floor(audio.getVolume() * 100);
                volumeControl.val(newV);
                iconVolume.html('<i class="fas fa-volume-up fa-2x">');
                audio.unMute();
            }
            else
            {
                iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
                audio.mute();
            }
        });

        // Listen to music/fx controls
        $('#switch-music').change(i =>
        {
            const checked = i.target.checked;
            if (!checked) audio.muteMusic();
            else audio.unmuteMusic();
        });
        // $('#switch-effects').change(i =>
        // {
        //     const checked = i.target.checked;
        //     if (!checked) audio.muteEffects();
        //     else audio.unmuteEffects();
        // });
    },

    stopVolumeController()
    {
        const iconVolume = $('#volume-status');
        iconVolume.off('click');
        const volumeControl = $('#main-volume-controller');
        volumeControl.off('input change');
        $('#switch-music').off('change');
        // $('#switch-effects').off('change');
    },

    // Navigation

    selectItems()
    {
        return [
            $('#volume-control-wrapper'),
            $('#return'),
        ];
    },

    navigate(options)
    {
        const app = this.settingsModule.app;
        const audio = app.engine.audio;

        this.super.navigate.call(this, options);

        // manage audio
        if (this.activeItem === 0) // vol control
        {
            const volumeControl = $('#main-volume-controller');
            const iconVolume = $('#volume-status');
            if (options === 'right' || options === 'left') // slider
            {
                const volume = audio.getVolume();
                const newVolume =
                    options === 'right' ?
                        Math.min(volume + 0.05, 1.) :
                        Math.max(volume - 0.05, 0.);
                audio.setVolume(newVolume);

                if (newVolume === 0)
                    iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
                else
                {
                    iconVolume.html('<i class="fas fa-volume-up fa-2x">');
                    audio.playText(' Cxy');
                }

                volumeControl.val(Math.floor(newVolume * 100));
            }
            else if (options === 'enter') // toggle
            {
                const isMute = audio.isMute();
                if (isMute)
                {
                    const newV = Math.floor(audio.getVolume() * 100);
                    volumeControl.val(newV);
                    iconVolume.html('<i class="fas fa-volume-up fa-2x">');
                    audio.unMute();
                }
                else
                {
                    iconVolume.html('<i class="fas fa-volume-mute fa-2x">');
                    audio.mute();
                }
            }
        }
    }

});

export { AudioMenu };
