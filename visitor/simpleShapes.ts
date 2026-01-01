namespace SimpleShapes {
  interface ShapeVisitor {
    visit(shape: Shape): void;
  }

  abstract class Shape {
    accept(visitor: ShapeVisitor) {
      visitor.visit(this);
    }
  }

  class Circle extends Shape {
    constructor(public radius: number) {
      super();
    }
  }

  class Square extends Shape {
    constructor(public sideLength: number) {
      super();
    }
  }

  class Rectangle extends Shape {
    constructor(public width: number, public height: number) {
      super();
    }
  }

  class Triangle extends Shape {
    constructor(public base: number, public height: number) {
      super();
    }
  }

  class AreaCalculator implements ShapeVisitor {
    totalArea: number = 0;

    // NOTE Megamorphic visit method
    visit(shape: Rectangle): void;
    visit(shape: Square): void;
    visit(shape: Triangle): void;
    visit(shape: Circle): void;
    visit(shape: unknown) {
      if (shape instanceof Square) {
        this.totalArea += shape.sideLength * shape.sideLength;
        return;
      }

      if (shape instanceof Rectangle) {
        this.totalArea += shape.width * shape.height;
        return;
      }

      if (shape instanceof Triangle) {
        this.totalArea += 0.5 * shape.base * shape.height;
        return;
      }

      if (shape instanceof Circle) {
        this.totalArea += Math.PI * shape.radius * shape.radius;
        return;
      }

      console.warn(
        "Area calculation not implemented for this shape, skipping..."
      );
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
