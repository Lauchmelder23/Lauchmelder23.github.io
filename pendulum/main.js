let canvas;

let points = [];
let shapeComplete = false;
let mouseSnap = false;

let attachPoint;
let attachPointSelected = false;

let m;
let centerMass;
let inertia;

let L;
let g = 9.81;
let acc = 0;
let vel = 0;
let theta = 0;

let canvasSize = 2; // 2 meters, whatever

function screenToWorld(point)
{
    returnVal = createVector(point.x, point.y);
    returnVal.div(width);
    returnVal.mult(canvasSize);

    return returnVal;
}

function worldToScreen(point)
{
    returnVal = createVector(point.x, point.y);
    returnVal.div(canvasSize);
    returnVal.mult(width);

    return returnVal;
}

function insideShape(point)
{
    if(!shapeComplete)
        return 0;

    // Raycasting algorithm
    point = worldToScreen(point);
    var j = points.length - 1;
    var oddNodes = false;

    var i;
    for (i = 0; i < points.length; i++) 
    {
        if ((points[i].y < point.y && points[j].y >= point.y 
            || points[j].y < point.y && points[i].y >= point.y) 
            && (points[i].x <= point.x || points[j].x <= point.x)) 
        {
            if (points[i].x + (point.y - points[i].y) / (points[j].y - points[i].y) * (points[j].x - points[i].x) < point.x) 
            {
                oddNodes = !oddNodes; 
            }
        }
        j=i; 
    }

    return (oddNodes ? 19300 * 0.01  : 0);    // 19.3 kgm^-3 at 1cm thick
}

function massHelper(y, samples)
{
    var origin = createVector(0, 0);

    var h = canvasSize / samples;
    var sum = 0.5 * (insideShape(createVector(0, y)) + insideShape(createVector(canvasSize, y)));

    for(var i = 1; i <= samples - 1; i++)
    {
        var point = createVector(i * h, y);
        sum += insideShape(point);
    }

    return h * sum;
}

function mass(samples)
{
    var h = canvasSize / samples;
    var sum = 0.5 * (massHelper(0, samples) + massHelper(canvasSize, samples));

    for(var i = 1; i <= samples - 1; i++)
    {
        sum += massHelper(i * h, samples);
    }

    return h * sum;
}

function momentOfInertiaHelper(y, samples)
{
    var origin = createVector(0, 0);

    var h = canvasSize / samples;
    var sum = 0.5 * (
        insideShape(createVector(0, y)) * pow(createVector(0, y).dist(origin) / canvasSize, 2) 
        + insideShape(createVector(canvasSize, y)) * pow(createVector(0, y).dist(origin) / canvasSize, 2)
    );

    for(var i = 1; i <= samples - 1; i++)
    {
        var point = createVector(i * h, y);
        sum += insideShape(point) * pow(point.dist(origin) / canvasSize, 2)
    }

    return h * sum;
}

function momentOfInertia(samples)
{
    var h = canvasSize / samples;
    var sum = 0.5 * (momentOfInertiaHelper(0, samples) + momentOfInertiaHelper(canvasSize, samples));

    for(var i = 1; i <= samples - 1; i++)
    {
        sum += momentOfInertiaHelper(i * h, samples);
    }

    return h * sum;
}

function centerOfMassHelper(y, samples)
{
    var origin = createVector(0, 0);

    var h = canvasSize / samples;

    var v0 = createVector(0, y);
    var vn = createVector(canvasSize, y);
    v0.mult(insideShape(v0));
    vn.mult(insideShape(vn));

    var sum = v0;
    sum.add(vn);
    sum.mult(0.5);

    for(var i = 1; i <= samples - 1; i++)
    {
        var point = createVector(i * h, y);
        point.mult(insideShape(point));
        sum.add(point);
    }

    sum.mult(h);
    return sum;
}

function centerOfMass(samples) {
    m = mass(samples);

    var h = canvasSize / samples;
    var sum = centerOfMassHelper(0, samples);
    sum.add(centerOfMassHelper(canvasSize, samples));
    sum.mult(0.5);
    for(var i = 1; i <= samples - 1; i++)
    {
        sum.add(centerOfMassHelper(i * h, samples));
    }
    
    sum.mult(h);
    sum.mult(1 / m);

    return sum;
}

function simulate()
{
    acc = -m*g*L*sin(theta) / inertia;
    if(abs(theta) > 0.0001) acc -= 0.2 * vel;
    console.log(degrees(theta));
    vel += acc * deltaTime / 1000;
    var dtheta = theta;
    theta += vel * deltaTime / 1000;
    dtheta -= theta;

    worldAttach = screenToWorld(attachPoint);

    points.forEach(function(item, index) {
        item.sub(attachPoint);
        item.rotate(dtheta);
        item.add(attachPoint);
    });

    centerMass.sub(worldAttach);
    centerMass.rotate(dtheta);
    centerMass.add(worldAttach);
}

function setup() 
{
    canvas = createCanvas(displayHeight / 4 * 3, displayHeight / 4 * 3);
    canvas.mouseClicked(handleClick);
}

function draw()
{
    background(10);

    // Draw vertices
    fill(255, 50, 50);
    stroke(0, 0, 0, 0);
    points.forEach(function(item, index) {
        rect(item.x - 5, item.y - 5, 10, 10);
    });

    // Draw lines between vertices
    stroke(255);
    fill(200, 50, 50, 50);
    if(!shapeComplete)
    {
        points.forEach(function(item, index) {
            if(index !== points.length - 1)
                line(item.x, item.y, points[index + 1].x, points[index + 1].y);
        });
    }
    else
    {
        beginShape();
        points.forEach(function(item, index) {
            vertex(item.x, item.y);
        });
        endShape()

        fill(50, 50, 255);
        com = worldToScreen(centerMass);
        rect(com.x - 5, com.y - 5, 10, 10);
    }

    if(!shapeComplete)
    {
        // Draw "cursor"
        fill(255, 150, 150);
        var cursorPos = createVector(mouseX, mouseY);

        if(points.length > 2)
        {
            if(cursorPos.dist(points[0]) < 20)
            {
                cursorPos = points[0];
                mouseSnap = true;
            }
            else
                mouseSnap = false;
        }

        rect(cursorPos.x - 5, cursorPos.y - 5, 10, 10);
    }
    else
    {
        line(points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y);
    }

    if(shapeComplete && !attachPointSelected)
    {
        fill(150, 255, 150);
        rect(mouseX - 5, mouseY - 5, 10, 10);
    }
    else if(attachPointSelected)
    {
        fill(50, 255, 50);
        rect(attachPoint.x - 5, attachPoint.y - 5, 10, 10);

        simulate();
    }
}

function handleClick(event)
{
    if(!shapeComplete)
    {
        if(!mouseSnap)
        {
            points.push(createVector(mouseX, mouseY));
            // console.log(points);
        }
        else
        {
            shapeComplete = true;
            inertia = momentOfInertia(100);
            centerMass = centerOfMass(100);

            document.getElementById("inst").innerHTML = "Use your mouse to select the pivot point."
        }
    }
    else if(!attachPointSelected)
    {
        attachPoint = createVector(mouseX, mouseY);
        attachPointSelected = true;

        L = centerMass.dist(screenToWorld(attachPoint));
        var helper = screenToWorld(attachPoint)
        helper.sub(centerMass);
        theta = helper.angleBetween(createVector(0, -1));
        // alert(degrees(theta));

        document.getElementById("inst").innerHTML = "Mass: " + m.toFixed(3) + " kg --- Moment of inertia: " + inertia.toFixed(3) + " kgm^-2 --- Canvas is 2m wide --- Simulated material is tungsten at 1cm thickness";
    }
}