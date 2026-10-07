import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'

/**
 * The old size names are removed, and the type is the only guard: no runtime
 * check reads the name, and `Button` throws on one. So the elements are
 * created, not rendered. The typecheck fails when a directive finds no error.
 */
describe('removed size names', () => {
  it('are rejected by the props types', () => {
    const elements = [
      // @ts-expect-error -- use size="extraSmall"
      <Button key="xs" size="xs">
        A
      </Button>,
      // @ts-expect-error -- use size="medium"
      <Button key="m" size="m">
        B
      </Button>,
      // @ts-expect-error -- use size="extraLarge"
      <IconButton key="xl" icon="star" size="xl" accessibilityLabel="C" />,
      // @ts-expect-error -- use size="extraSmall"
      <Avatar key="xSmall" size="xSmall" />,
      // @ts-expect-error -- use size="extraLarge"
      <Avatar key="xLarge" size="xLarge" />,
    ]
    expect(elements).toHaveLength(5)
  })
})
