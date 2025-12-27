package java.src.examples;

import java.src.examples.Pose2d;
import java.src.examples.Rotation2d;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        final Rotation2d skib = Rotation2d.fromDegrees(90);
        final Pose2d pose = (new Pose2d(0, 0, skib));
        final Pose2d newPose = pose;
        final Rotation2d rotation = Rotation2d.fromDegrees(180);

        System.out.println(pose.getX());
        System.out.println(rotation.getRadians());
    }
}
