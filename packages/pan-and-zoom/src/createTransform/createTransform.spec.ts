import { createTransform } from './createTransform'

test('no transforms', () => {
  expect(`${createTransform()}`).toBe('')
})

test('translate', () => {
  expect(`${createTransform().translate(10, 20)}`).toBe('translate(10px, 20px)')
})

test('scale', () => {
  expect(`${createTransform().scale(10, 20)}`).toBe('scale(10, 20)')
})

test('combinations of scale and translate', () => {
  expect(
    `${createTransform()
      .scale()
      .translate()
      .translate(10, 10)
      .scale(2)}`
  ).toBe('scale(1, 1) translate(0px, 0px) translate(10px, 10px) scale(2, 2)')
})
