async function buscarEndereco(cep) {
    const cepLimpo = String(cep).replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
        throw new Error('CEP inválido')
    }

    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)

    if (!resposta.ok) {
        throw new Error('Erro ao consultar o serviço de CEP')
    }

    const dados = await resposta.json()

    if (dados.erro) {
        throw new Error('CEP não encontrado')
    }

    return {
        cep: dados.cep,
        rua: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.localidade,
        estado: dados.uf
    }
}

module.exports = { buscarEndereco }