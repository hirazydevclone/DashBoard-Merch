const axios = require('axios').default;
const timeout = 10000;
const baseUrl = 'http://127.0.0.1:12368';
const os = require('os');
const fs = require('fs');
const path = require('path');

class Hidemyacc {
    constructor() {}

    createFolder() {
        this.homedir = os.homedir();
        this.hidemyaccPath = path.join(this.homedir, '.hidemyacc');
        this.mbaPath = path.join(this.homedir, '.hidemyacc', 'mba');
        console.log("MBA Path " + this.mbaPath)
        if (!fs.existsSync(this.mbaPath)) {
            fs.mkdirSync(this.mbaPath)
        }
    }

    getFolerPath(){
        const homedir = os.homedir();
        const hidemyaccPath = path.join(this.homedir, '.hidemyacc');
        const mbaPath = path.join(this.homedir, '.hidemyacc', 'mba');
        return mbaPath
    }

    createFilePath(name){
        const homedir = os.homedir();
        const hidemyaccPath = path.join(this.homedir, '.hidemyacc');
        const filePath = path.join(this.homedir, '.hidemyacc', 'mba', name);
        return filePath
    }

    async me() {
        return await this.#get(`${baseUrl}/me`);
    }

    async folders() {
        return await this.#get(`${baseUrl}/folders`);
    }

    async profiles() {
        return await this.#get(`${baseUrl}/profiles`);
    }

    async create(os = 'win', name = undefined, notes = undefined, browser = 'chrome', proxy = undefined) {
        const body = { os, name, notes, browser, proxy: proxy ? JSON.stringify(proxy) : undefined };
        return await this.#post(`${baseUrl}/profiles`, body);
    }

    async start(id) {
        return await this.#post(`${baseUrl}/profiles/start/${id}`);
    }

    async status() {
        return await this.#get(`${baseUrl}/profiles/status`);
    }

    async stop(id) {
        return await this.#post(`${baseUrl}/profiles/stop/${id}`);
    }

    async delete(id) {
        return await this.#post(`${baseUrl}/profiles/delete/${id}`);
    }

    async#get(url) {
        try {
            const response = await axios.get(url, {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                timeout,
            });
            return response.data;
        } catch (e) {
            console.log(e);
        }
        return null;
    }

    async#post(url, body = {}) {
        try {
            const response = await axios.post(url, body, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout,
            });
            return response.data;
        } catch (e) {
            console.log(e);
        }
        return null;
    }
}

module.exports = Hidemyacc;