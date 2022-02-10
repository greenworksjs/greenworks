export default (os: string, arch: string) => {
    var greenworks = require(`../../artifacts/greenworks-node-${os}-${arch}.node`);

    console.log('greenworks', greenworks)
    console.log('done ?', greenworks.initialize());
}