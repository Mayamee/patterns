namespace SimpleShapesMono {
  interface ShapeVisitor {
    // NOTE Monomorphic visit methods - fast performance
    visitCircle(shape: Circle): void;
    visitSquare(shape: Square): void;
    visitRectangle(shape: Rectangle): void;
    visitTriangle(shape: Triangle): void;
  }

  interface IVisitorShape {
    accept(visitor: ShapeVisitor): void;
  }

  interface IClonable<T> {
    clone(): T;
  }

  class Circle implements IVisitorShape, IClonable<Circle> {
    constructor(public radius: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitCircle(this);
    }

    clone(): Circle {
      return new Circle(this.radius);
    }
  }

  class Square implements IVisitorShape, IClonable<Square> {
    constructor(public sideLength: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitSquare(this);
    }

    clone(): Square {
      return new Square(this.sideLength);
    }
  }

  class Rectangle implements IVisitorShape, IClonable<Rectangle> {
    constructor(public width: number, public height: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitRectangle(this);
    }

    clone(): Rectangle {
      return new Rectangle(this.width, this.height);
    }
  }

  class Triangle implements IVisitorShape, IClonable<Triangle> {
    constructor(public base: number, public height: number) {}
    accept(visitor: ShapeVisitor): void {
      visitor.visitTriangle(this);
    }

    clone(): Triangle {
      return new Triangle(this.base, this.height);
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

  class PerimeterCalculator implements ShapeVisitor {
    totalPerimeter: number = 0;

    visitCircle(shape: Circle): void {
      this.totalPerimeter += 2 * Math.PI * shape.radius;
    }

    visitSquare(shape: Square): void {
      this.totalPerimeter += 4 * shape.sideLength;
    }

    visitRectangle(shape: Rectangle): void {
      this.totalPerimeter += 2 * (shape.width + shape.height);
    }

    visitTriangle(shape: Triangle): void {
      // Assuming an equilateral triangle for simplicity
      this.totalPerimeter += 3 * shape.base;
    }
  }

  class ScalingVisitor implements ShapeVisitor {
    constructor(private scaleFactor: number) {}

    visitCircle(shape: Circle): void {
      shape.radius *= this.scaleFactor;
    }

    visitSquare(shape: Square): void {
      shape.sideLength *= this.scaleFactor;
    }

    visitRectangle(shape: Rectangle): void {
      shape.width *= this.scaleFactor;
      shape.height *= this.scaleFactor;
    }

    visitTriangle(shape: Triangle): void {
      shape.base *= this.scaleFactor;
      shape.height *= this.scaleFactor;
    }
  }

  class CloningVisitor implements ShapeVisitor {
    clones: IVisitorShape[] = [];

    visitCircle(shape: Circle): void {
      this.clones.push(shape.clone());
    }

    visitSquare(shape: Square): void {
      this.clones.push(shape.clone());
    }

    visitRectangle(shape: Rectangle): void {
      this.clones.push(shape.clone());
    }

    visitTriangle(shape: Triangle): void {
      this.clones.push(shape.clone());
    }
  }

  const structure: (IVisitorShape & IClonable<IVisitorShape>)[] = [
    new Circle(5),
    new Square(4),
    new Rectangle(3, 6),
    new Triangle(4, 5),
  ];

  const areaCalculator = new AreaCalculator();
  const perimeterCalculator = new PerimeterCalculator();
  const scalingVisitor = new ScalingVisitor(2);
  const cloningVisitor = new CloningVisitor();

  structure.forEach((shape) => shape.accept(areaCalculator));
  structure.forEach((shape) => shape.accept(perimeterCalculator));
  structure.forEach((shape) => shape.accept(scalingVisitor));
  structure.forEach((shape) => shape.accept(cloningVisitor));

  const clonedStructure = structure.map((shape) => shape.clone());

  console.log(`Total Area: ${areaCalculator.totalArea}`);
  console.log(`Total Perimeter: ${perimeterCalculator.totalPerimeter}`);
  console.log(`Cloned Structure:`, clonedStructure);
  console.log(`Cloned Structure via CloningVisitor:`, cloningVisitor.clones);

  const cc = new Circle(3);

  cc.accept(areaCalculator);

  console.log(`Total Area: ${areaCalculator.totalArea}`);
}
