package examples;

public record Rotation2d(double heading) {
    public static final Rotation2d kZero = new Rotation2d(0);
    public static final Rotation2d kCW_Pi_2 = new Rotation2d(-Math.PI / 2);
    public static final Rotation2d kCW_90deg = new Rotation2d(-Math.PI / 2);
    public static final Rotation2d kCCW_Pi_2 = new Rotation2d(Math.PI / 2);
    public static final Rotation2d kCCW_90deg = new Rotation2d(Math.PI / 2);
    public static final Rotation2d kPi = new Rotation2d(Math.PI);
    public static final Rotation2d k180deg = new Rotation2d(Math.PI / 2);
    public static final Rotation2d k2Pi = Rotation2d.fromRadians(2 * Math.PI);

    public static Rotation2d fromDegrees(double degrees) {
        return new Rotation2d(Math.toRadians(degrees));
    }

    public static Rotation2d fromRadians(double radians) {
        return new Rotation2d(radians);
    }

    public static Rotation2d fromRotations(double rotations) {
        return new Rotation2d(rotations * 2 * Math.PI);
    }
}