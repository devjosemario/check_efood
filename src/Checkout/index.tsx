import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import InputMask from 'react-input-mask'

import { usePurchaseMutation } from '../services/api'
import { RootReducer } from '../store'
import { close as closeCheckout } from '../store/reducers/checkout'
import { open as openCart, clear } from '../store/reducers/cart'

import Button from '../Button'
import { formataPreco } from '../utils/formatters'

import { CartContainer, Overlay } from '../Cart/styles'
import * as S from './styles'

const Checkout = () => {
  const [purchase, { data, isLoading, isSuccess }] = usePurchaseMutation()

  const { isOpen } = useSelector((state: RootReducer) => state.checkout)
  const { items } = useSelector((state: RootReducer) => state.cart)
  const dispatch = useDispatch()

  const [etapa, setEtapa] = useState<'entrega' | 'pagamento' | 'finalizado'>(
    'entrega'
  )

  const getValorTotal = () => items.reduce((acc, item) => acc + item.preco, 0)

  const form = useFormik({
    initialValues: {
      destinatario: '',
      endereco: '',
      cidade: '',
      cep: '',
      numeroDaCasa: '',
      complemento: '',
      nomeCartao: '',
      numeroCartao: '',
      cvv: '',
      mesVencimento: '',
      anoVencimento: ''
    },
    validationSchema: Yup.object({
      destinatario: Yup.string()
        .matches(/^[A-Za-zÀ-ÿ\s]+$/, 'O nome deve conter apenas letras')
        .min(3, 'Mínimo 3 caracteres')
        .required('Campo obrigatório'),
      endereco: Yup.string().required('Campo obrigatório'),
      cidade: Yup.string().required('Campo obrigatório'),
      cep: Yup.string()
        .matches(/^\d{5}-?\d{3}$/, 'CEP inválido (formato: 12345-678)')
        .required('Campo obrigatório'),
      numeroDaCasa: Yup.string().required('Campo obrigatório'),
      complemento: Yup.string().notRequired(),
      nomeCartao: Yup.string()
        .min(3, 'Mínimo 3 caracteres')
        .required('Campo obrigatório'),
      numeroCartao: Yup.string()
        .transform((value) => value.replace(/\s/g, ''))
        .matches(/^\d+$/, 'Digite apenas números')
        .min(13, 'Mínimo 13 números')
        .max(19, 'Máximo 19 números')
        .required('Campo obrigatório'),
      cvv: Yup.string()
        .matches(/^\d+$/, 'Digite apenas números')
        .min(3, 'Mínimo 3 números')
        .max(4, 'Máximo 4 números')
        .required('Campo obrigatório'),
      mesVencimento: Yup.string()
        .matches(/^(0[1-9]|1[0-2])$/, 'Mês inválido (01 a 12)')
        .required('Campo obrigatório'),
      anoVencimento: Yup.string()
        .matches(/^\d{2}$/, 'Ano inválido (2 dígitos)')
        .required('Campo obrigatório')
        .test('valid-expiration', 'Cartão expirado', function (value) {
          const { mesVencimento } = this.parent
          if (!value || !mesVencimento) return true
          const currentYear = new Date().getFullYear() % 100
          const currentMonth = new Date().getMonth() + 1
          const expirationYear = parseInt(value, 10)
          const expirationMonth = parseInt(mesVencimento, 10)
          if (expirationYear < currentYear) return false
          if (expirationYear === currentYear && expirationMonth < currentMonth)
            return false
          return true
        })
    }),
    onSubmit: (values) => {
      purchase({
        delivery: {
          receiver: values.destinatario,
          address: {
            description: values.endereco,
            city: values.cidade,
            zipCode: values.cep,
            number: Number(values.numeroDaCasa),
            complement: values.complemento
          }
        },
        payment: {
          card: {
            name: values.nomeCartao,
            number: values.numeroCartao,
            code: Number(values.cvv),
            expires: {
              month: Number(values.mesVencimento),
              year: Number(values.anoVencimento)
            }
          }
        },
        products: items.map((item) => ({
          id: item.id,
          price: item.preco
        }))
      })
    }
  })

  const hasError = (fieldName: string) =>
    fieldName in form.touched && fieldName in form.errors

  const handleCloseCheckout = () => {
    dispatch(closeCheckout())
    setEtapa('entrega')
    form.resetForm()
  }

  const handleOpenCart = () => {
    handleCloseCheckout()
    dispatch(openCart())
  }

  const handleContinuarEntrega = async () => {
    const errors = await form.validateForm()
    const camposEntrega = [
      'destinatario',
      'endereco',
      'cidade',
      'cep',
      'numeroDaCasa'
    ]
    const errosEntrega = camposEntrega.filter(
      (campo) => errors[campo as keyof typeof errors]
    )
    if (errosEntrega.length === 0) {
      setEtapa('pagamento')
    } else {
      const touched: Record<string, boolean> = {}
      camposEntrega.forEach((campo) => (touched[campo] = true))
      form.setTouched(touched)
    }
  }

  const handleFinalizarPagamento = async () => {
    const errors = await form.validateForm()
    const camposPagamento = [
      'nomeCartao',
      'numeroCartao',
      'cvv',
      'mesVencimento',
      'anoVencimento'
    ]
    const errosPagamento = camposPagamento.filter(
      (campo) => errors[campo as keyof typeof errors]
    )
    if (errosPagamento.length === 0) {
      form.handleSubmit()
    } else {
      form.setTouched({
        nomeCartao: true,
        numeroCartao: true,
        cvv: true,
        mesVencimento: true,
        anoVencimento: true
      })
    }
  }

  useEffect(() => {
    if (isSuccess && data) {
      setEtapa('finalizado')
      dispatch(clear())
    }
  }, [isSuccess, data, dispatch])

  return (
    <CartContainer className={isOpen ? 'is-open' : ''}>
      <Overlay onClick={handleCloseCheckout} />
      <S.Aside>
        <form onSubmit={form.handleSubmit}>
          {etapa === 'entrega' && (
            <>
              <h3>Entrega</h3>
              <S.FormGroup>
                <label htmlFor="destinatario">Quem irá receber</label>
                <S.Input
                  id="destinatario"
                  name="destinatario"
                  type="text"
                  value={form.values.destinatario}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={hasError('destinatario') ? 'erro' : ''}
                />
                {hasError('destinatario') && (
                  <S.ErrorMsg>{form.errors.destinatario as string}</S.ErrorMsg>
                )}
              </S.FormGroup>

              <S.FormGroup>
                <label htmlFor="endereco">Endereço</label>
                <S.Input
                  id="endereco"
                  name="endereco"
                  type="text"
                  value={form.values.endereco}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={hasError('endereco') ? 'erro' : ''}
                />
                {hasError('endereco') && (
                  <S.ErrorMsg>{form.errors.endereco as string}</S.ErrorMsg>
                )}
              </S.FormGroup>

              <S.FormGroup>
                <label htmlFor="cidade">Cidade</label>
                <S.Input
                  id="cidade"
                  name="cidade"
                  type="text"
                  value={form.values.cidade}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={hasError('cidade') ? 'erro' : ''}
                />
                {hasError('cidade') && (
                  <S.ErrorMsg>{form.errors.cidade as string}</S.ErrorMsg>
                )}
              </S.FormGroup>

              <S.Row>
                <S.FormGroup>
                  <label htmlFor="cep">CEP</label>
                  <S.Input
                    as={InputMask}
                    mask="99999-999"
                    id="cep"
                    name="cep"
                    type="text"
                    value={form.values.cep}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('cep') ? 'erro' : ''}
                  />
                  {hasError('cep') && (
                    <S.ErrorMsg>{form.errors.cep as string}</S.ErrorMsg>
                  )}
                </S.FormGroup>

                <S.FormGroup>
                  <label htmlFor="numeroDaCasa">Número</label>
                  <S.Input
                    id="numeroDaCasa"
                    name="numeroDaCasa"
                    type="text"
                    value={form.values.numeroDaCasa}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('numeroDaCasa') ? 'erro' : ''}
                  />
                  {hasError('numeroDaCasa') && (
                    <S.ErrorMsg>
                      {form.errors.numeroDaCasa as string}
                    </S.ErrorMsg>
                  )}
                </S.FormGroup>
              </S.Row>

              <S.FormGroup>
                <label htmlFor="complemento">Complemento (opcional)</label>
                <S.Input
                  id="complemento"
                  name="complemento"
                  type="text"
                  value={form.values.complemento}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </S.FormGroup>

              <S.ButtonGroup>
                <Button
                  type="button"
                  title="Continuar para o pagamento"
                  variant="secondary"
                  onClick={handleContinuarEntrega}
                >
                  Continuar com o pagamento
                </Button>
                <Button
                  type="button"
                  title="Voltar para o carrinho"
                  variant="secondary"
                  onClick={handleOpenCart}
                >
                  Voltar para o carrinho
                </Button>
              </S.ButtonGroup>
            </>
          )}

          {etapa === 'pagamento' && (
            <>
              <h3>Pagamento - Valor a pagar {formataPreco(getValorTotal())}</h3>

              <S.FormGroup>
                <label htmlFor="nomeCartao">Nome no cartão</label>
                <S.Input
                  id="nomeCartao"
                  name="nomeCartao"
                  type="text"
                  value={form.values.nomeCartao}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={hasError('nomeCartao') ? 'erro' : ''}
                />
                {hasError('nomeCartao') && (
                  <S.ErrorMsg>{form.errors.nomeCartao as string}</S.ErrorMsg>
                )}
              </S.FormGroup>

              <S.Row>
                <S.FormGroup style={{ flex: 2 }}>
                  <label htmlFor="numeroCartao">Número do cartão</label>
                  <S.Input
                    as={InputMask}
                    mask="9999 9999 9999 9999"
                    id="numeroCartao"
                    name="numeroCartao"
                    type="text"
                    value={form.values.numeroCartao}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('numeroCartao') ? 'erro' : ''}
                  />
                  {hasError('numeroCartao') && (
                    <S.ErrorMsg>
                      {form.errors.numeroCartao as string}
                    </S.ErrorMsg>
                  )}
                </S.FormGroup>

                <S.FormGroup style={{ flex: 1 }}>
                  <label htmlFor="cvv">CVV</label>
                  <S.Input
                    as={InputMask}
                    mask="999"
                    id="cvv"
                    name="cvv"
                    type="text"
                    value={form.values.cvv}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('cvv') ? 'erro' : ''}
                  />
                  {hasError('cvv') && (
                    <S.ErrorMsg>{form.errors.cvv as string}</S.ErrorMsg>
                  )}
                </S.FormGroup>
              </S.Row>

              <S.Row>
                <S.FormGroup>
                  <label htmlFor="mesVencimento">Mês de vencimento</label>
                  <S.Input
                    as={InputMask}
                    mask="99"
                    id="mesVencimento"
                    name="mesVencimento"
                    type="text"
                    value={form.values.mesVencimento}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('mesVencimento') ? 'erro' : ''}
                  />
                  {hasError('mesVencimento') && (
                    <S.ErrorMsg>
                      {form.errors.mesVencimento as string}
                    </S.ErrorMsg>
                  )}
                </S.FormGroup>

                <S.FormGroup>
                  <label htmlFor="anoVencimento">Ano de vencimento</label>
                  <S.Input
                    as={InputMask}
                    mask="99"
                    id="anoVencimento"
                    name="anoVencimento"
                    type="text"
                    value={form.values.anoVencimento}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={hasError('anoVencimento') ? 'erro' : ''}
                  />
                  {hasError('anoVencimento') && (
                    <S.ErrorMsg>
                      {form.errors.anoVencimento as string}
                    </S.ErrorMsg>
                  )}
                </S.FormGroup>
              </S.Row>

              <S.ButtonGroup>
                <Button
                  type="button"
                  title="Finalizar pagamento"
                  variant="secondary"
                  onClick={handleFinalizarPagamento}
                  disabled={isLoading}
                >
                  {isLoading ? 'Finalizando...' : 'Finalizar pagamento'}
                </Button>
                <Button
                  type="button"
                  title="Voltar para a edição de endereço"
                  variant="secondary"
                  onClick={() => setEtapa('entrega')}
                >
                  Voltar para a edição de endereço
                </Button>
              </S.ButtonGroup>
            </>
          )}

          {etapa === 'finalizado' && (
            <>
              <h3>Pedido realizado - {data?.orderId ?? ''}</h3>
              <p>
                Estamos felizes em informar que seu pedido já está em processo
                de preparação e, em breve, será entregue no endereço fornecido.
              </p>
              <p>
                Gostaríamos de ressaltar que nossos entregadores não estão
                autorizados a realizar cobranças extras.
              </p>
              <p>
                Lembre-se da importância de higienizar as mãos após o
                recebimento do pedido, garantindo assim sua segurança e
                bem-estar durante a refeição.
              </p>
              <p>
                Esperamos que desfrute de uma deliciosa e agradável experiência
                gastronômica. Bom apetite!
              </p>
              <S.ButtonGroup>
                <Button
                  type="button"
                  title="Concluir e voltar para o início"
                  variant="secondary"
                  onClick={handleCloseCheckout}
                >
                  Concluir
                </Button>
              </S.ButtonGroup>
            </>
          )}
        </form>
      </S.Aside>
    </CartContainer>
  )
}

export default Checkout
