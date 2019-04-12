beforeEach(() => {
  cy.visit('http://localhost:3000')
})

it('zooms out to the top left', () => {
  cy.get('svg')
    .zoomOut({ x: 0, y: 0 })
    .get('html')
    .should('have.css', 'transform', 'matrix(0.5, 0, 0, 0.5, 0, 0)')
})

it('zooms in to the top left', () => {
  cy.get('svg')
    .zoomIn({ x: 0, y: 0 })
    .get('html')
    .should('have.css', 'transform', 'matrix(2, 0, 0, 2, 0, 0)')
})

it('zooms out from the center', () => {
  cy.get('svg')
    .zoomOut({ x: 300, y: 300 })
    .get('html')
    .should('have.css', 'transform', 'matrix(0.5, 0, 0, 0.5, 150, 150)')
})

it('zooms in to the center', () => {
  cy.get('svg')
    .zoomIn({ x: 300, y: 300 })
    .get('html')
    .should('have.css', 'transform', 'matrix(2, 0, 0, 2, -300, -300)')
})

it('zooms out from the bottom right', () => {
  cy.get('svg')
    .zoomOut({ x: 600, y: 600 })
    .get('html')
    .should('have.css', 'transform', 'matrix(0.5, 0, 0, 0.5, 300, 300)')
})

it('zooms in to the bottom right', () => {
  cy.get('svg')
    .zoomIn({ x: 600, y: 600 })
    .get('html')
    .should('have.css', 'transform', 'matrix(2, 0, 0, 2, -600, -600)')
})

it('zooms back to the original position', () => {
  cy.get('svg')
    .zoomOut({
      x: 600,
      y: 600,
    })
    .zoomIn({
      x: 600,
      y: 600,
    })
    .get('html')
    .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 0)')
})

it('zooms back to a different position when the mouse moves has moved to a different position', () => {
  cy.get('svg')
    .zoomIn({
      x: 0,
      y: 0,
    })
    .zoomOut({
      x: 0,
      y: 150,
    })
    .get('html')
    .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 150)')
})
