const os = require('os');
const path = require('path');

export interface IAppDirectory {
    app: string;
    platform: string;
    userData: () => string;
}

export class AppDirectory implements IAppDirectory {
    public app: string;
    public platform: string;

    constructor(appName: string) {
        this.app = appName;
        this.platform = os.platform();
    }

    public userData() {
        let dataPath: string;
        if (this.platform === 'darwin') {
            dataPath = path.join(os.homedir(), 'Library', 'Application Support', `${this.app}`);
        } else if (this.platform === 'win32') {
            dataPath = path.join(os.homedir(), 'AppData', 'Local', `${this.app}`);
        } else if (this.platform === 'linux') {
            dataPath = path.join(os.homedir(), 'local', 'share', `${this.app}`);
        } else {
            dataPath = '';
        }
        return dataPath;
    }
}
