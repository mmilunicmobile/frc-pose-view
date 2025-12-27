export class Pose2d {
    x: number;
    y: number;
    heading: Rotation2d;

    constructor(x: number, y: number, heading: Rotation2d) {
        this.x = x;
        this.y = y;
        this.heading = heading;
    }

    toString(): string {
        return `Pose2d(${this.x}, ${this.y}, ${this.heading})`;
    }
}

export class Rotation2d {
    heading: number;

    constructor(heading: number) {
        this.heading = heading;
    }

    toString(): string {
        return `Rotation2d(${this.heading})`;
    }
}