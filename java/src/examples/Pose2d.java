package java.src.examples;

import java.util.Objects;

/** Represents a 2D pose containing translational and rotational elements. */
public class Pose2d {
    /**
     * A preallocated Pose2d representing the origin.
     *
     * <p>
     * This exists to avoid allocations for common poses.
     */
    public static final Pose2d kZero = new Pose2d();

    private final Translation2d m_translation;
    private final Rotation2d m_rotation;

    /** Constructs a pose at the origin facing toward the positive X axis. */
    public Pose2d() {
        m_translation = Translation2d.kZero;
        m_rotation = Rotation2d.kZero;
    }

    /**
     * Constructs a pose with the specified translation and rotation.
     *
     * @param translation The translational component of the pose.
     * @param rotation    The rotational component of the pose.
     */
    public Pose2d(Translation2d translation, Rotation2d rotation) {
        m_translation = translation;
        m_rotation = rotation;
    }

    /**
     * Constructs a pose with x and y translations instead of a separate
     * Translation2d.
     *
     * @param x        The x component of the translational component of the pose.
     * @param y        The y component of the translational component of the pose.
     * @param rotation The rotational component of the pose.
     */
    public Pose2d(double x, double y, Rotation2d rotation) {
        m_translation = new Translation2d(x, y);
        m_rotation = rotation;
    }

    /**
     * Returns the translation component of the transformation.
     *
     * @return The translational component of the pose.
     */
    public Translation2d getTranslation() {
        return m_translation;
    }

    /**
     * Returns the X component of the pose's translation.
     *
     * @return The x component of the pose's translation.
     */
    public double getX() {
        return m_translation.getX();
    }

    /**
     * Returns the Y component of the pose's translation.
     *
     * @return The y component of the pose's translation.
     */
    public double getY() {
        return m_translation.getY();
    }

    /**
     * Returns the rotational component of the transformation.
     *
     * @return The rotational component of the pose.
     */
    public Rotation2d getRotation() {
        return m_rotation;
    }

    /**
     * Multiplies the current pose by a scalar.
     *
     * @param scalar The scalar.
     * @return The new scaled Pose2d.
     */
    public Pose2d times(double scalar) {
        return new Pose2d(m_translation.times(scalar), m_rotation.times(scalar));
    }

    /**
     * Divides the current pose by a scalar.
     *
     * @param scalar The scalar.
     * @return The new scaled Pose2d.
     */
    public Pose2d div(double scalar) {
        return times(1.0 / scalar);
    }

    /**
     * Rotates the pose around the origin and returns the new pose.
     *
     * @param other The rotation to transform the pose by.
     * @return The transformed pose.
     */
    public Pose2d rotateBy(Rotation2d other) {
        return new Pose2d(m_translation.rotateBy(other), m_rotation.rotateBy(other));
    }

    /**
     * Rotates the current pose around a point in 2D space.
     *
     * @param point The point in 2D space to rotate around.
     * @param rot   The rotation to rotate the pose by.
     * @return The new rotated pose.
     */
    public Pose2d rotateAround(Translation2d point, Rotation2d rot) {
        return new Pose2d(m_translation.rotateAround(point, rot), m_rotation.rotateBy(rot));
    }

    @Override
    public String toString() {
        return String.format("Pose2d(%s, %s)", m_translation, m_rotation);
    }

    /**
     * Checks equality between this Pose2d and another object.
     *
     * @param obj The other object.
     * @return Whether the two objects are equal or not.
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof Pose2d)) {
            return false;
        }
        Pose2d pose = (Pose2d) obj;
        return m_translation.equals(pose.m_translation)
                && m_rotation.equals(pose.m_rotation);
    }

    @Override
    public int hashCode() {
        return Objects.hash(m_translation, m_rotation);
    }
}