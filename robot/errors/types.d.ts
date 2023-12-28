import {CyberErrorOptions} from 'cyber-codex/error/lib/types';

export interface RobotErrorOptions extends CyberErrorOptions {
    rotateSession?: boolean,
    retireSession?: boolean
}