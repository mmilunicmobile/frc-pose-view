export class Rotation2d {
    public static kZero = new Rotation2d(0);
    public static kCW_Pi_2 = new Rotation2d(-Math.PI / 2);
    public static kCW_90deg = Rotation2d.kCW_Pi_2;
    public static kCCW_Pi_2 = new Rotation2d(Math.PI / 2);
    public static kCCW_90deg = Rotation2d.kCCW_Pi_2;
    public static kPi = new Rotation2d(Math.PI);
    public static k180deg = Rotation2d.kPi;

    private m_value: number;
    private m_cos: number;
    private m_sin: number;

    constructor(value: number, y?: number) {
        if (y !== undefined) {
            // value is x, y is y
            const x = value;
            const magnitude = Math.hypot(x, y);
            if (magnitude > 1e-6) {
                this.m_cos = x / magnitude;
                this.m_sin = y / magnitude;
            } else {
                this.m_cos = 1.0;
                this.m_sin = 0.0;
                console.error("x and y components of Rotation2d are zero");
            }
            this.m_value = Math.atan2(this.m_sin, this.m_cos);
        } else {
            // value is radians
            this.m_value = value;
            this.m_cos = Math.cos(value);
            this.m_sin = Math.sin(value);
        }
    }

    static fromRadians(radians: number): Rotation2d {
        return new Rotation2d(radians);
    }

    static fromDegrees(degrees: number): Rotation2d {
        return new Rotation2d(degrees * (Math.PI / 180));
    }

    static fromRotations(rotations: number): Rotation2d {
        return new Rotation2d(rotations * 2 * Math.PI);
    }

    plus(other: Rotation2d): Rotation2d {
        return this.rotateBy(other);
    }

    minus(other: Rotation2d): Rotation2d {
        return this.rotateBy(other.unaryMinus());
    }

    unaryMinus(): Rotation2d {
        return new Rotation2d(-this.m_value);
    }

    times(scalar: number): Rotation2d {
        return new Rotation2d(this.m_value * scalar);
    }

    div(scalar: number): Rotation2d {
        return this.times(1.0 / scalar);
    }

    rotateBy(other: Rotation2d): Rotation2d {
        return new Rotation2d(
            this.m_cos * other.m_cos - this.m_sin * other.m_sin,
            this.m_cos * other.m_sin + this.m_sin * other.m_cos
        );
    }

    getRadians(): number {
        return this.m_value;
    }

    getDegrees(): number {
        return this.m_value * (180 / Math.PI);
    }

    getRotations(): number {
        return this.m_value / (2 * Math.PI);
    }

    getCos(): number {
        return this.m_cos;
    }

    getSin(): number {
        return this.m_sin;
    }

    getTan(): number {
        return this.m_sin / this.m_cos;
    }

    toString(): string {
        return `Rotation2d(Rads: ${this.m_value.toFixed(3)}, Deg: ${(this.m_value * 180 / Math.PI).toFixed(3)})`;
    }

    equals(obj: any): boolean {
        if (obj instanceof Rotation2d) {
            return Math.hypot(this.m_cos - obj.m_cos, this.m_sin - obj.m_sin) < 1e-9;
        }
        return false;
    }
}

export class Translation2d {
    public static kZero = new Translation2d(0, 0);

    private m_x: number;
    private m_y: number;

    constructor(x: number, y: number) {
        this.m_x = x;
        this.m_y = y;
    }

    getDistance(other: Translation2d): number {
        return Math.hypot(other.m_x - this.m_x, other.m_y - this.m_y);
    }

    getSquaredDistance(other: Translation2d): number {
        const dx = other.m_x - this.m_x;
        const dy = other.m_y - this.m_y;
        return dx * dx + dy * dy;
    }

    getX(): number {
        return this.m_x;
    }

    getY(): number {
        return this.m_y;
    }

    getNorm(): number {
        return Math.hypot(this.m_x, this.m_y);
    }

    getSquaredNorm(): number {
        return this.m_x * this.m_x + this.m_y * this.m_y;
    }

    getAngle(): Rotation2d {
        return new Rotation2d(this.m_x, this.m_y);
    }

    rotateBy(other: Rotation2d): Translation2d {
        return new Translation2d(
            this.m_x * other.getCos() - this.m_y * other.getSin(),
            this.m_x * other.getSin() + this.m_y * other.getCos()
        );
    }

    rotateAround(other: Translation2d, rot: Rotation2d): Translation2d {
        return new Translation2d(
            (this.m_x - other.getX()) * rot.getCos() - (this.m_y - other.getY()) * rot.getSin() + other.getX(),
            (this.m_x - other.getX()) * rot.getSin() + (this.m_y - other.getY()) * rot.getCos() + other.getY()
        );
    }

    dot(other: Translation2d): number {
        return this.m_x * other.m_x + this.m_y * other.m_y;
    }

    cross(other: Translation2d): number {
        return this.m_x * other.m_y - this.m_y * other.m_x;
    }

    plus(other: Translation2d): Translation2d {
        return new Translation2d(this.m_x + other.m_x, this.m_y + other.m_y);
    }

    minus(other: Translation2d): Translation2d {
        return new Translation2d(this.m_x - other.m_x, this.m_y - other.m_y);
    }

    unaryMinus(): Translation2d {
        return new Translation2d(-this.m_x, -this.m_y);
    }

    times(scalar: number): Translation2d {
        return new Translation2d(this.m_x * scalar, this.m_y * scalar);
    }

    div(scalar: number): Translation2d {
        return new Translation2d(this.m_x / scalar, this.m_y / scalar);
    }

    toString(): string {
        return `Translation2d(X: ${this.m_x.toFixed(3)}, Y: ${this.m_y.toFixed(3)})`;
    }

    equals(obj: any): boolean {
        if (obj instanceof Translation2d) {
            return Math.abs(obj.m_x - this.m_x) < 1e-9 && Math.abs(obj.m_y - this.m_y) < 1e-9;
        }
        return false;
    }
}

export class Pose2d {
    public static kZero = new Pose2d(0, 0, new Rotation2d(0));

    private m_translation: Translation2d;
    private m_rotation: Rotation2d;

    constructor(xOrTranslation: number | Translation2d, yOrRotation: number | Rotation2d, rotation?: Rotation2d) {
        if (xOrTranslation instanceof Translation2d && yOrRotation instanceof Rotation2d) {
            this.m_translation = xOrTranslation;
            this.m_rotation = yOrRotation;
        } else if (typeof xOrTranslation === 'number' && typeof yOrRotation === 'number' && rotation instanceof Rotation2d) {
            this.m_translation = new Translation2d(xOrTranslation, yOrRotation);
            this.m_rotation = rotation;
        } else {
            this.m_translation = Translation2d.kZero;
            this.m_rotation = Rotation2d.kZero;
        }
    }

    getTranslation(): Translation2d {
        return this.m_translation;
    }

    getX(): number {
        return this.m_translation.getX();
    }

    getY(): number {
        return this.m_translation.getY();
    }

    getRotation(): Rotation2d {
        return this.m_rotation;
    }

    times(scalar: number): Pose2d {
        return new Pose2d(this.m_translation.times(scalar), this.m_rotation.times(scalar));
    }

    div(scalar: number): Pose2d {
        return this.times(1.0 / scalar);
    }

    rotateBy(other: Rotation2d): Pose2d {
        return new Pose2d(this.m_translation.rotateBy(other), this.m_rotation.rotateBy(other));
    }

    rotateAround(point: Translation2d, rot: Rotation2d): Pose2d {
        return new Pose2d(this.m_translation.rotateAround(point, rot), this.m_rotation.rotateBy(rot));
    }

    toString(): string {
        return `Pose2d(${this.m_translation}, ${this.m_rotation})`;
    }

    equals(obj: any): boolean {
        if (obj instanceof Pose2d) {
            return this.m_translation.equals(obj.m_translation) && this.m_rotation.equals(obj.m_rotation);
        }
        return false;
    }
}