const a = {
    o: {b: 1},
    b: {b: 2},
    c: {b: 3},
};

const d = {
    t() {
        const l = { x: {b: 4}, ...a};
        console.log(l);
    },
};

export default d;
