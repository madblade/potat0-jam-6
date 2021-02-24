import { Label } from './label';
import { Title } from './Title';

let TextModule = {

    createTextLabel(textSequence)
    {
        if (!textSequence) textSequence = {
            direct: true,
            text: 'Je crois qu’on m’a oubliée.'
        };
        return new Label(textSequence);
    },

    createTitleLabel(text)
    {
        const t = new Title(text);
        t.center();
        return t;
    },

};

export { TextModule };
