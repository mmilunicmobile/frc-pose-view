package java.src.examples;

import java.src.examples.Pose2d;
import java.src.examples.Rotation2d;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        final Rotation2d skib = new Rotation2d(0.5, 0.1);
        final Pose2d pose = (new Pose2d(0, 0, skib));
        final Pose2d newPose = Constants.kOne;
        final Rotation2d rotation = Rotation2d.fromDegrees(45);

        System.out.println(pose.getRotation().getRadians());
        System.out.println(rotation.getRadians());
        System.out.println(pose.getTranslation().getX());
        System.out.println(newPose.getTranslation().getX());
    }
}
