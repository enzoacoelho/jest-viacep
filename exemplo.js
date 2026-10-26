const { buscarEndereco } = require('./src/buscarEndereco')

const cep = process.argv[2] || '01001-000'

buscarEndereco(cep)
    .then((endereco) => {
        console.log('Endereço encontrado:')
        console.log(endereco)
    })
    .catch((erro) => {
        console.error('Não foi possível buscar o endereço:', erro.message)
    })