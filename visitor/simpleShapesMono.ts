namespace SimpleShapesMono {
  interface ShapeVisitor {
    // NOTE Monomorphic visit methods - fast performance
    visitCircle(shape: Circle): void;
    visitSquare(shape: Square): void;
    visitRectangle(shape: Rectangle): void;
    visitTriangle(shape: Triangle): void;
  }

  interface Shape {
    accept(visitor: ShapeVisitor): void;
  }

  class Circle implements Shape {
    constructor(public radius: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitCircle(this);
    }
  }

  class Square implements Shape {
    constructor(public sideLength: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitSquare(this);
    }
  }

  class Rectangle implements Shape {
    constructor(public width: number, public height: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitRectangle(this);
    }
  }

  class Triangle implements Shape {
    constructor(public base: number, public height: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitTriangle(this);
    }
  }

  class AreaCalculator implements ShapeVisitor {
    totalArea: number = 0;

    visitCircle(shape: Circle): void {
      this.totalArea += Math.PI * shape.radius * shape.radius;
    }

    visitSquare(shape: Square): void {
      this.totalArea += shape.sideLength * shape.sideLength;
    }

    visitRectangle(shape: Rectangle): void {
      this.totalArea += shape.width * shape.height;
    }

    visitTriangle(shape: Triangle): void {
      this.totalArea += 0.5 * shape.base * shape.height;
    }
  }

  const structure: Shape[] = [
    new Circle(5),
    new Square(4),
    new Rectangle(3, 6),
    new Triangle(4, 5),
  ];

  const areaCalculator = new AreaCalculator();

  structure.forEach((shape) => shape.accept(areaCalculator));

  const cc = new Circle(3);

  cc.accept(areaCalculator);

  console.log(`Total Area: ${areaCalculator.totalArea}`);
}
