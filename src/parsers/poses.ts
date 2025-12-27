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

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getRotation(): Rotation2d {
        return this.heading;
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

    getDegrees(): number {
        return this.heading * 180 / Math.PI;
    }

    getRadians(): number {
        return this.heading;
    }

    getSin(): number {
        return Math.sin(this.heading);
    }

    getCos(): number {
        return Math.cos(this.heading);
    }
}