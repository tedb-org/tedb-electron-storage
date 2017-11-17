
export const stringifyJSON = (data: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            if (Object.prototype.toString.call(data) === '[object String]') {
                resolve(data);
            } else {
                const json = JSON.stringify(data);
                resolve(json);
            }
        } catch (e) {
            return reject(new Error(':::Storage::: stringifyJSON Error.'));
        }
    });
};
