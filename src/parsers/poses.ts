export class Pose2d {
    x: number;
    y: number;
    heading: Rotation2d;

    constructor(x: number, y: number, heading: Rotation2d) {
        this.x = x;
        this.y = y;
        this.heading = heading;
    }
}

export class Rotation2d {
    heading: number;

    constructor(heading: number) {
        this.heading = heading;
    }
}