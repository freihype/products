const randomByte = function () {
    return Math.round(Math.random() * 256);
};

export const randomIp = function () {
    let ip = randomByte() + '.' +
        randomByte() + '.' +
        randomByte() + '.' +
        randomByte();
    if (isPrivate(ip)) { return randomIp(); }
    return ip;
};

const isPrivate = function (ip) {
    return /^10\.|^192\.168\.|^172\.16\.|^172\.17\.|^172\.18\.|^172\.19\.|^172\.20\.|^172\.21\.|^172\.22\.|^172\.23\.|^172\.24\.|^172\.25\.|^172\.26\.|^172\.27\.|^172\.28\.|^172\.29\.|^172\.30\.|^172\.31\./.test(ip);
};

const privateIps = [
    '10.0.0.0',
    '10.255.255.255',
    '172.16.0.0',
    '172.31.255.255',
    '192.168.0.0',
    '192.168.255.255'
];

const publicIps = [
    '0.0.0.0',
    '255.255.255.255',
];
/*

for (var i = 0; i < privateIps.length; i++) {
    assert(isPrivate(privateIps[i]), privateIps[i] + ' should be private, but is considered public!');
}

for (var i = 0; i < publicIps.length; i++) {
    assert(!isPrivate(publicIps[i]), privateIps[i] + ' should be public, but was considered private!');
}*/
