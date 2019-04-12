Cypress.Commands.add(
  'pan',
  {
    prevSubject: true,
  },
  (subject, { from, to }) => {
    cy.wrap(subject)
      .trigger('pointerdown', {
        force: true,
        clientX: from.x,
        clientY: from.y,
        button: 0,
      })
      .trigger('pointermove', {
        force: true,
        clientX: to.x,
        clientY: to.y,
      })
      .trigger('pointerup', {
        force: true,
        clientX: to.x,
        clientY: to.y,
      })
  }
)

Cypress.Commands.add(
  'zoomIn',
  {
    prevSubject: true,
  },
  (subject, { x, y }) =>
    cy.wrap(subject).trigger('wheel', {
      force: true,
      deltaY: -1,
      clientX: x,
      clientY: y,
    })
)

Cypress.Commands.add(
  'zoomOut',
  {
    prevSubject: true,
  },
  (subject, { x, y }) =>
    cy.wrap(subject).trigger('wheel', {
      force: true,
      deltaY: 1,
      clientX: x,
      clientY: y,
    })
)

declare namespace Cypress {
  interface Chainable<Subject> {
    zoomIn: ({
      x,
      y,
    }: {
      x: number
      y: number
    }) => Cypress.Chainable<JQuery<HTMLElement>>
    zoomOut: ({
      x,
      y,
    }: {
      x: number
      y: number
    }) => Cypress.Chainable<JQuery<HTMLElement>>
    pan: ({
      from,
      to,
    }: {
      from: { x: number; y: number }
      to: { x: number; y: number }
    }) => Cypress.Chainable<JQuery<HTMLElement>>
  }
}
