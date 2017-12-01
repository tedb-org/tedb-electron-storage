
export const safeParse = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            const json = JSON.parse(data);
            // this could be used to save and read back items as buffers
            /*if (json.hasOwnProperty('type')) {
                if (json.type === 'Buffer') {
                    const buff = Buffer.from(JSON.parse(data).data);
                    json = JSON.stringify(buff);
                    json = JSON.parse(json);
                }
            }*/
            resolve(json);
        } catch (e) {
            resolve(false);
        }
    });
};
