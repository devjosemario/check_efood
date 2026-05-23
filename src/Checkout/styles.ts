import styled from 'styled-components'
import { breackpoints, cores } from '../styles'
import { ButtonContainer, ButtonLink } from '../Button/styles'

export const Aside = styled.aside`
  background-color: ${cores.salmao};
  z-index: 1001;
  padding: 32px 8px 16px 8px;
  max-width: 360px;
  width: 100%;
  overflow-y: auto;
  color: ${cores.salmaoClaro};

  h3 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 24px;
    color: ${cores.salmaoClaro};
  }

  p {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    margin-bottom: 16px;
    color: ${cores.salmaoClaro};
  }

  label {
    font-size: 14px;
    font-weight: 700;
    color: ${cores.salmaoClaro};
    display: block;
    margin-bottom: 4px;
  }

  ${ButtonContainer}, ${ButtonLink} {
    display: block;
    width: 100%;
    text-align: center;
    padding: 6px 8px;
    font-size: 14px;
  }

  @media (max-width: ${breackpoints.mobile}) {
    width: 85%;
    max-width: none;
  }
`

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  flex: 1;
`

export const Input = styled.input`
  height: 32px;
  padding: 0 8px;
  background-color: ${cores.salmaoClaro};
  border: none;
  outline: none;
  width: 100%;
  font-size: 14px;

  &.erro {
    border: 2px solid #ff4444;
  }
`

export const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 0;

  @media (max-width: ${breackpoints.mobile}) {
    flex-direction: column;
    gap: 0;
  }
`

export const ErrorMsg = styled.span`
  font-size: 11px;
  color: #ffcccc;
  margin-top: 3px;
`

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
`
