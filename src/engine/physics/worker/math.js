
/* global Ammo */

let math = {

    T: [],
    Q: [],
    V3: [],
    M3: [],

    torad: Math.PI / 180, // 0.0174532925199432957,
    todeg: 180 / Math.PI, // 57.295779513082320876,

    clamp(value, min, max)
    {
        return Math.max(min, Math.min(max, value));
    },

    eulerToQuadArray(array, deg)
    {
        if (deg) array = math.vectomult(array, math.torad);

        var q = math.quaternion().setFromEuler(array);
        var result = q.toArray();
        q.free();

        return result;
    },

    getLength()
    {
        return `T:${math.T.length} Q:${math.Q.length} V:${math.V3.length}`;
    },

    destroy()
    {
        while (math.T.length > 0) Ammo.destroy(math.T.pop());
        while (math.Q.length > 0) Ammo.destroy(math.Q.pop());
        while (math.V3.length > 0) Ammo.destroy(math.V3.pop());
        math.M3 = [];
    },

    transform()
    {
        return math.T.length > 0 ? math.T.pop() : new Ammo.btTransform();
    },

    freeTransform(t)
    {
        math.T.push(t);
    },

    quaternion()
    {
        return math.Q.length > 0 ? math.Q.pop() : new Ammo.btQuaternion();
    },

    freeQuaternion(q)
    {
        math.Q.push(q);
    },

    vector3()
    {
        return math.V3.length > 0 ? math.V3.pop() : new Ammo.btVector3();
    },

    freeVector3(v)
    {
        math.V3.push(v);
    },

    matrix3()
    {
        return math.M3.length > 0 ? math.M3.pop() : new Matrix3();//new Ammo.btMatrix3x3();
    },

    freeMatrix3(v)
    {
        math.M3.push(v);
    },

    vectomult(r, scale)
    {
        r = r.map(function(x)
        {
            return x * scale;
        });

        return r;
    },

    distanceArray(p1, p2)
    {
        var x = p2[0] - p1[0];
        var y = p2[1] - p1[1];
        var z = p2[2] - p1[2];
        return Math.sqrt(x * x + y * y + z * z);
    },
};

let mathExtend = function()
{
    //--------------------------------------------------
    //  ammo btTransform extend
    //--------------------------------------------------
    Ammo.btTransform.prototype = Object.assign(Object.create(Ammo.btTransform.prototype), {

        identity()
        {
            this.setIdentity();
            return this;
        },

        positionFromArray(array, offset, scale)
        {
            offset = offset || 0;

            var p = math.vector3().fromArray(array, offset, scale);
            this.setOrigin(p);
            p.free();

            return this;
        },

        eulerFromArray(array, offset)
        {
            offset = offset || 0;

            var q = math.quaternion().setFromEuler(array, offset);
            this.setRotation(q);
            q.free();

            return this;
        },

        eulerFromArrayZYX(array, offset)
        {
            offset = offset || 0;
            this.getBasis().setEulerZYX(array[offset], array[offset + 1], array[offset + 2]);
            return this;
        },

        getRow(n)
        {
            return this.getBasis().getRow(n);
        },

        makeRotationDir(axis)
        {
            var dir = math.vector3().fromArray(axis);
            var up = math.vector3(0, 1, 0);


            var xaxis = math.vector3().cross(up, dir).normalize();
            var yaxis = math.vector3().cross(dir, xaxis).normalize();

            var m3 = math.matrix3();

            var q = m3.setV3(xaxis, yaxis, dir).toQuaternion().normalize();

            this.setRotation(q);

            m3.free();
            q.free();
            dir.free();
            up.free();
            xaxis.free();
            yaxis.free();
        },

        setFromDirection(axis)
        {
            var dir = math.vector3().fromArray(axis);
            var axe = math.vector3();
            var q = math.quaternion();

            if (dir.y() > 0.99999) {
                q.set(0, 0, 0, 1);
            } else if (dir.y() < -0.99999) {
                q.set(1, 0, 0, 0);
            } else {
                axe.set(dir.z(), 0, -dir.x());
                var radians = Math.acos(dir.y());
                q.setFromAxisAngle(axe.toArray(), radians);
            }

            this.setRotation(q);

            dir.free();
            axe.free();
            q.free();

            return this;
        },

        quaternionFromAxis(array)
        {
            var q = math.quaternion().setFromAxis(array);
            this.setRotation(q);
            q.free();

            return this;
        },

        quaternionFromAxisAngle(array, angle)
        {
            var q = math.quaternion().setFromAxisAngle(array, angle);
            this.setRotation(q);
            q.free();

            return this;
        },

        quaternionFromArray(array, offset)
        {
            offset = offset || 0;

            var q = math.quaternion().fromArray(array, offset);
            this.setRotation(q);
            q.free();

            return this;
        },

        fromArray(array, offset, scale)
        {
            offset = offset || 0;
            this.positionFromArray(array, offset, scale);

            if (array.length > 3) {
                this.quaternionFromArray(array, offset + 3);
            }

            return this;
        },

        toArray(array, offset, scale)
        {
            offset = offset || 0;

            this.getOrigin().toArray(array, offset, scale);
            this.getRotation().toArray(array, offset + 3);
        },

        getInverse()
        {
            var t = math.transform();
            t.setIdentity();

            var m = this.getRotation().toMatrix3().transpose();
            var o = this.getOrigin().clone().negate();
            var v = m.multiplyByVector3(o);
            var q = m.toQuaternion();

            t.setOrigin(v);
            t.setRotation(q);

            o.free();
            v.free();
            q.free();
            m.free();

            return t;
        },

        multiply(t)
        {
            var m1 = this.getRotation().toMatrix3();
            var m2 = t.getRotation().toMatrix3();
            var o1 = this.getOrigin().clone();
            var o2 = t.getOrigin().clone();

            var v = m1.multiplyByVector3(o2).add(o1);
            this.setOrigin(v);

            m1.multiply(m2);
            var q = m1.toQuaternion();
            this.setRotation(q);

            m1.free();
            m2.free();
            o1.free();
            o2.free();
            q.free();
            v.free();

            return this;
        },

        clone()
        {
            var t = math.transform();
            t.setIdentity();
            t.setOrigin(this.getOrigin());
            t.setRotation(this.getRotation());
            return t;
        },

        copy(t)
        {
            this.setOrigin(t.getOrigin());
            this.setRotation(t.getRotation());
            return this;
        },

        free()
        {
            math.freeTransform(this);
        }
    });

    //--------------------------------------------------
    //  ammo btVector3 extend
    //--------------------------------------------------
    Ammo.btVector3.prototype = Object.assign(Object.create(Ammo.btVector3.prototype), {

        set(x, y, z)
        {
            this.setValue(x, y, z);
            return this;
        },

        zero()
        {
            this.setValue(0, 0, 0);
            return this;
        },

        negate()
        {
            this.setValue(-this.x(), -this.y(), -this.z());
            return this;
        },

        add(v)
        {
            this.setValue(this.x() + v.x(), this.y() + v.y(), this.z() + v.z());
            return this;
        },

        sub(v)
        {
            this.setValue(this.x() - v.x(), this.y() - v.y(), this.z() - v.z());
            return this;
        },

        dot(v)
        {
            return this.x() * v.x() + this.y() * v.y() + this.z() * v.z();
        },

        cross(a, b)
        {
            var ax = a.x();
            var ay = a.y();
            var az = a.z();
            var bx = b.x();
            var by = b.y();
            var bz = b.z();

            this.set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
            return this;
        },

        multiplyScalar(scale)
        {
            this.setValue(this.x() * scale, this.y() * scale, this.z() * scale);
            return this;
        },

        multiplyArray(ary)
        {
            this.setValue(this.x() * ary[0], this.y() * ary[1], this.z() * ary[2]);
            return this;
        },

        fromArray(array, offset, scale)
        {
            offset = offset || 0;
            scale = scale || 1;

            this.setValue(array[offset] * scale, array[offset + 1] * scale, array[offset + 2] * scale);
            return this;
        },

        divideScalar(scalar)
        {
            return this.multiplyScalar(1 / scalar);
        },

        length()
        {
            return Math.sqrt(this.x() * this.x() + this.y() * this.y() + this.z() * this.z());
        },

        normalize()
        {
            return this.divideScalar(this.length() || 1);
        },

        toArray(array, offset, scale)
        {
            if (array === undefined) array = [];
            if (offset === undefined) offset = 0;

            scale = scale || 1;

            array[offset] = this.x() * scale;
            array[offset + 1] = this.y() * scale;
            array[offset + 2] = this.z() * scale;

            return array;
        },

        direction(q)
        {
            // quaternion
            var qx = q.x();
            var qy = q.y();
            var qz = q.z();
            var qw = q.w();

            var x = this.x();
            var y = this.y();
            var z = this.z();

            // calculate quat * vector
            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = -qx * x - qy * y - qz * z;

            // calculate result * inverse quat
            var xx = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            var yy = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            var zz = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            this.setValue(xx, yy, zz);
            return this;
        },

        clone()
        {
            return math.vector3().set(this.x(), this.y(), this.z());
        },

        free()
        {
            math.freeVector3(this);
        }
    });

    //--------------------------------------------------
    //  ammo btQuaternion extend
    //--------------------------------------------------
    Ammo.btQuaternion.prototype = Object.assign(Object.create(Ammo.btQuaternion.prototype), {

        set(x, y, z, w)
        {
            this.setValue(x, y, z, w);
            return this;
        },

        fromArray(array, offset)
        {
            if (offset === undefined) offset = 0;
            this.setValue(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);

            return this;
        },

        toArray(array, offset)
        {
            if (array === undefined) array = [];
            if (offset === undefined) offset = 0;

            array[offset] = this.x();
            array[offset + 1] = this.y();
            array[offset + 2] = this.z();
            array[offset + 3] = this.w();

            return array;
        },

        setFromAxis(axis)
        {
            if (axis[2] > 0.99999) this.setValue(0, 0, 0, 1);
            else if (axis[2] < -0.99999) this.setValue(1, 0, 0, 0);
            else
            {
                var ax = [axis[1], axis[0], 0];
                var r = Math.acos(axis[2]);
                this.setFromAxisAngle(ax, r);
            }

            return this;
        },

        setFromAxisAngle(axis, angle)
        {
            var halfAngle = angle * 0.5;
            var s = Math.sin(halfAngle);
            this.setValue(axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(halfAngle));
            return this;
        },

        setFromEuler(euler)
        {
            var x = euler[0];
            var y = euler[1];
            var z = euler[2];
            var order = euler[3] || 'XYZ';

            var cos = Math.cos;
            var sin = Math.sin;

            var c1 = cos(x * 0.5);
            var c2 = cos(y * 0.5);
            var c3 = cos(z * 0.5);

            var s1 = sin(x * 0.5);
            var s2 = sin(y * 0.5);
            var s3 = sin(z * 0.5);

            var qx;
            var qy;
            var qz;
            var qw;

            if (order === 'XYZ') {
                qx = s1 * c2 * c3 + c1 * s2 * s3;
                qy = c1 * s2 * c3 - s1 * c2 * s3;
                qz = c1 * c2 * s3 + s1 * s2 * c3;
                qw = c1 * c2 * c3 - s1 * s2 * s3;
            } else if (order === 'YXZ') {
                qx = s1 * c2 * c3 + c1 * s2 * s3;
                qy = c1 * s2 * c3 - s1 * c2 * s3;
                qz = c1 * c2 * s3 - s1 * s2 * c3;
                qw = c1 * c2 * c3 + s1 * s2 * s3;
            } else if (order === 'ZXY') {
                qx = s1 * c2 * c3 - c1 * s2 * s3;
                qy = c1 * s2 * c3 + s1 * c2 * s3;
                qz = c1 * c2 * s3 + s1 * s2 * c3;
                qw = c1 * c2 * c3 - s1 * s2 * s3;
            } else if (order === 'ZYX') {
                qx = s1 * c2 * c3 - c1 * s2 * s3;
                qy = c1 * s2 * c3 + s1 * c2 * s3;
                qz = c1 * c2 * s3 - s1 * s2 * c3;
                qw = c1 * c2 * c3 + s1 * s2 * s3;
            } else if (order === 'YZX') {
                qx = s1 * c2 * c3 + c1 * s2 * s3;
                qy = c1 * s2 * c3 + s1 * c2 * s3;
                qz = c1 * c2 * s3 - s1 * s2 * c3;
                qw = c1 * c2 * c3 - s1 * s2 * s3;
            } else if (order === 'XZY') {
                qx = s1 * c2 * c3 - c1 * s2 * s3;
                qy = c1 * s2 * c3 - s1 * c2 * s3;
                qz = c1 * c2 * s3 + s1 * s2 * c3;
                qw = c1 * c2 * c3 + s1 * s2 * s3;
            }

            this.setValue(qx, qy, qz, qw);
            return this;
        },

        toMatrix3()
        {
            var m = [];

            var x = this.x();
            var y = this.y();
            var z = this.z();
            var w = this.w();

            var xx = x * x;
            var yy = y * y;
            var zz = z * z;

            var xy = x * y;
            var yz = y * z;
            var zx = z * x;

            var xw = x * w;
            var yw = y * w;
            var zw = z * w;

            m[0] = 1 - 2 * (yy + zz);
            m[1] = 2 * (xy - zw);
            m[2] = 2 * (zx + yw);
            m[3] = 2 * (xy + zw);
            m[4] = 1 - 2 * (zz + xx);
            m[5] = 2 * (yz - xw);
            m[6] = 2 * (zx - yw);
            m[7] = 2 * (yz + xw);
            m[8] = 1 - 2 * (xx + yy);

            return math.matrix3().fromArray(m);
        },

        length()
        {
            return Math.sqrt(this.x() * this.x() + this.y() * this.y() + this.z() * this.z() + this.w() * this.w());
        },

        normalize()
        {
            var l = this.length();

            if (l === 0) {
                return this.set(0, 0, 0, 1);
            } else {
                l = 1 / l;
                return this.set(this.x() * l, this.y() * l, this.z() * l, this.w() * l);
            }
        },

        multiply(q)
        {
            return this.multiplyQuaternions(this, q);
        },

        multiplyQuaternions(a, b)
        {
            var qax = a.x();
            var qay = a.y();
            var qaz = a.z();
            var qaw = a.w();
            var qbx = b.x();
            var qby = b.y();
            var qbz = b.z();
            var qbw = b.w();

            this.set(
                qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
                qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
                qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
                qaw * qbw - qax * qbx - qay * qby - qaz * qbz
            );

            return this;
        },

        clone()
        {
            return math.quaternion().set(this.x(), this.y(), this.z(), this.w());
        },

        free()
        {
            math.freeQuaternion(this);
        }
    });
};

//--------------------------------------------------
//  Matrix3
//--------------------------------------------------
function Matrix3()
{
    this.elements = [

        1, 0, 0,
        0, 1, 0,
        0, 0, 1

    ];
}

Object.assign(Matrix3.prototype, {

    set(n11, n12, n13, n21, n22, n23, n31, n32, n33)
    {
        var te = this.elements;

        te[0] = n11;
        te[1] = n21;
        te[2] = n31;
        te[3] = n12;
        te[4] = n22;
        te[5] = n32;
        te[6] = n13;
        te[7] = n23;
        te[8] = n33;

        return this;
    },

    setV3(xAxis, yAxis, zAxis)
    {
        var te = this.elements;

        te[0] = xAxis.x();
        te[3] = xAxis.y();
        te[6] = xAxis.z();

        te[1] = yAxis.x();
        te[4] = yAxis.y();
        te[7] = yAxis.z();

        te[2] = zAxis.x();
        te[5] = zAxis.y();
        te[8] = zAxis.z();

        return this;
    },

    transpose()
    {
        var tmp;
        var m = this.elements;

        tmp = m[1];
        m[1] = m[3];
        m[3] = tmp;
        tmp = m[2];
        m[2] = m[6];
        m[6] = tmp;
        tmp = m[5];
        m[5] = m[7];
        m[7] = tmp;

        return this;
    },

    fromArray(array, offset)
    {
        if (offset === undefined) offset = 0;

        for (var i = 0; i < 9; i++) {
            this.elements[i] = array[i + offset];
        }

        return this;
    },

    multiply(mtx)
    {
        var v10 = this.row(0);
        var v11 = this.row(1);
        var v12 = this.row(2);

        var v20 = mtx.column(0);
        var v21 = mtx.column(1);
        var v22 = mtx.column(2);

        var m = this.elements;

        m[0] = v10.dot(v20);
        m[1] = v10.dot(v21);
        m[2] = v10.dot(v22);
        m[3] = v11.dot(v20);
        m[4] = v11.dot(v21);
        m[5] = v11.dot(v22);
        m[6] = v12.dot(v20);
        m[7] = v12.dot(v21);
        m[8] = v12.dot(v22);

        v10.free();
        v11.free();
        v12.free();
        v20.free();
        v21.free();
        v22.free();

        return this;
    },

    multiplyByVector3(v)
    {
        var v0 = this.row(0);
        var v1 = this.row(1);
        var v2 = this.row(2);
        var v4 = math.vector3().set(v0.dot(v), v1.dot(v), v2.dot(v));
        v0.free();
        v1.free();
        v2.free();
        return v4;
    },

    toQuaternion()
    {
        var m = this.elements;

        var t = m[0] + m[4] + m[8];
        var s;
        var x;
        var y;
        var z;
        var w;

        if (t > 0) {
            s = Math.sqrt(t + 1.0) * 2;
            w = 0.25 * s;
            x = (m[7] - m[5]) / s;
            y = (m[2] - m[6]) / s;
            z = (m[3] - m[1]) / s;
        } else if (m[0] > m[4] && m[0] > m[8]) {
            s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2;
            w = (m[7] - m[5]) / s;
            x = 0.25 * s;
            y = (m[1] + m[3]) / s;
            z = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2;
            w = (m[2] - m[6]) / s;
            x = (m[1] + m[3]) / s;
            y = 0.25 * s;
            z = (m[5] + m[7]) / s;
        } else {
            s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2;
            w = (m[3] - m[1]) / s;
            x = (m[2] + m[6]) / s;
            y = (m[5] + m[7]) / s;
            z = 0.25 * s;
        }

        let q = math.quaternion().set(x, y, z, w);
        return q;
    },

    row(i)
    {
        var m = this.elements;
        var n = i * 3;
        return math.vector3().set(m[n], m[n + 1], m[n + 2]);
    },

    column(i)
    {
        var m = this.elements;
        return math.vector3().set(m[i], m[i + 3], m[i + 6]);
    },

    free()
    {
        math.freeMatrix3(this);
    },

});

export { math, mathExtend, Matrix3 };
