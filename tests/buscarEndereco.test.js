const { buscarEndereco } = require('../src/buscarEndereco')

const fetchOriginal = global.fetch

// Resposta falsa da API, no mesmo formato que o ViaCEP devolve
const respostaViaCep = {
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP'
}

beforeEach(() => {
    // Troca o fetch de verdade por um falso: nenhum teste acessa a internet
    global.fetch = jest.fn()
})

afterEach(() => {
    global.fetch = fetchOriginal
})

describe('Busca de endereço por CEP', () => {
    test('deve devolver o endereço quando o CEP existe', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => respostaViaCep
        })

        const endereco = await buscarEndereco('01001000')

        expect(endereco).toEqual({
            cep: '01001-000',
            rua: 'Praça da Sé',
            bairro: 'Sé',
            cidade: 'São Paulo',
            estado: 'SP'
        })
    })

    test('deve consultar a URL certa mesmo se o CEP vier com hífen', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => respostaViaCep
        })

        await buscarEndereco('01001-000')

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/')
    })

    test('deve avisar quando o CEP não é encontrado', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ erro: true })
        })

        await expect(buscarEndereco('99999999')).rejects.toThrow('CEP não encontrado')
    })

    test('deve avisar quando o serviço de CEP está com problema', async () => {
        fetch.mockResolvedValue({ ok: false })

        await expect(buscarEndereco('01001000')).rejects.toThrow('Erro ao consultar o serviço de CEP')
    })

    test('deve repassar o erro quando a internet cai', async () => {
        fetch.mockRejectedValue(new Error('Falha de rede'))

        await expect(buscarEndereco('01001000')).rejects.toThrow('Falha de rede')
    })

    test.each([
        ['deve limpar espaços nas pontas do CEP', ' 01001-000 ', '01001000'],
        ['deve limpar pontos e hífen do CEP', '01.001-000', '01001000'],
        ['deve aceitar CEP digitado como número', 30140071, '30140071']
    ])('%s', async (_descricao, cepDigitado, cepEsperadoNaUrl) => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => respostaViaCep
        })

        await buscarEndereco(cepDigitado)

        expect(fetch).toHaveBeenCalledWith(`https://viacep.com.br/ws/${cepEsperadoNaUrl}/json/`)
    })

    test('deve recusar CEP com dígitos a mais', async () => {
        await expect(buscarEndereco('010010000')).rejects.toThrow('CEP inválido')
        expect(fetch).not.toHaveBeenCalled()
    })

    test('deve devolver só os campos que interessam, ignorando o resto da API', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                ...respostaViaCep,
                complemento: 'lado ímpar',
                ibge: '3550308',
                ddd: '11'
            })
        })

        const endereco = await buscarEndereco('01001000')

        expect(Object.keys(endereco)).toEqual(['cep', 'rua', 'bairro', 'cidade', 'estado'])
    })

    test('deve aceitar CEP de cidade pequena, que vem sem rua e sem bairro', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                cep: '86200-000',
                logradouro: '',
                bairro: '',
                localidade: 'Ibiporã',
                uf: 'PR'
            })
        })

        const endereco = await buscarEndereco('86200000')

        expect(endereco.rua).toBe('')
        expect(endereco.cidade).toBe('Ibiporã')
    })

    test('deve repassar o erro quando a resposta da API não é um JSON válido', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => { throw new Error('JSON inválido') }
        })

        await expect(buscarEndereco('01001000')).rejects.toThrow('JSON inválido')
    })

    test.each([
        ['deve recusar CEP vazio', ''],
        ['deve recusar CEP com poucos dígitos', '123'],
        ['deve recusar CEP com letras', 'abcdefgh'],
        ['deve recusar CEP não informado', undefined]
    ])('%s', async (_descricao, cep) => {
        await expect(buscarEndereco(cep)).rejects.toThrow('CEP inválido')
        // CEP inválido nem chega a chamar a API
        expect(fetch).not.toHaveBeenCalled()
    })
})