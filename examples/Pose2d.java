package examples;

public record Pose2d(double x, double y, Rotation2d heading) {
    public static final Pose2d kZero = new Pose2d(0, 0, Rotation2d.kZero);
}
