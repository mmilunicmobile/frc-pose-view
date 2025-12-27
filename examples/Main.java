package examples;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        final Rotation2d skib = Rotation2d.fromDegrees(90);
        final Pose2d pose = (new Pose2d(0, 0, skib));
        final Rotation2d rotation = Rotation2d.fromDegrees(90);
        System.out.println(pose.x());
        System.out.println(rotation.heading());
    }
}
