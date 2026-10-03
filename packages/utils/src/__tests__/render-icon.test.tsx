import { renderIcon } from '../render-icon'

const props = { size: 24, color: '#000' }

describe('renderIcon', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('passes a string name to the resolver', () => {
    const resolver = jest.fn(() => null)
    renderIcon('check', props, resolver)
    expect(resolver).toHaveBeenCalledWith('check', props)
    expect(warn).not.toHaveBeenCalled()
  })

  it('renders null and warns once for a string name without a resolver', () => {
    expect(renderIcon('check', props, null)).toBeNull()
    expect(renderIcon('close', props, undefined)).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    const message = String(warn.mock.calls[0]?.[0])
    expect(message).toContain('"check"')
    expect(message).toContain('@rootnative/components/mdi')
  })

  it('does not call the resolver for an element or a function', () => {
    const resolver = jest.fn(() => null)
    const fn = jest.fn(() => null)
    renderIcon(fn, props, resolver)
    expect(fn).toHaveBeenCalledWith(props)
    expect(resolver).not.toHaveBeenCalled()
  })
})
