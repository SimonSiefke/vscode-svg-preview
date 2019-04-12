beforeEach(() => {
  cy.visit('http://localhost:3000')
})

it('pans from left to right', () => {
  cy.get('svg')
    // 300px to the right
    .pan({
      from: { x: 0, y: 0 },
      to: {
        x: 300,
        y: 0,
      },
    })
    .get('html')
    .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 300, 0)')
})

it('pans from bottom to top', () => {
  cy.get('svg')
    // 300px up
    .pan({
      from: { x: 300, y: 600 },
      to: {
        x: 300,
        y: 300,
      },
    })
    .get('html')
    .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, -300)')
})

it('pans around', () => {
  cy.get('svg')
    // 300px up
    .pan({
      from: { x: 300, y: 600 },
      to: {
        x: 300,
        y: 300,
      },
    })
    // 150px right
    .pan({
      from: { x: 0, y: 0 },
      to: {
        x: 150,
        y: 0,
      },
    })
    // 200px down and 100px left
    .pan({
      from: {
        x: 0,
        y: 0,
      },
      to: {
        x: -100,
        y: 200,
      },
    })
    .get('html')
    .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 50, -100)')
})
