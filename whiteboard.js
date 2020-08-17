var fs = require("fs"),
    PNG = require("pngjs").PNG,
   convert = require('color-convert');

function distance(a1,a2) {
  let t = 0;
  for(i in a1) {
    t += (a1[i] - a2[i]) ** 2;
  }
  return Math.sqrt(t);
}

function rgbToPos(r,g,b) {
  return [r,g,b].map(o => (o - 128) / 10);
}

function hsvToPos(h,s,v) {
  let y = (v-50) / 5;
  let x = (v/100) * (s/10) * Math.sin(h * (Math.PI/180));
  let z = (v/100) * (s/10) * Math.cos(h * (Math.PI/180));
  return [x,y,z];
}

function hslToPos(h,s,v) {
  let y = (v-50) / 5;
  let r = 1 - Math.abs(1 - (v/50));
  let x = r * (s/10) * Math.sin(h * (Math.PI/180));
  let z = r * (s/10) * Math.cos(h * (Math.PI/180));
  return [x,y,z];
}


fs.createReadStream("blank.png")
  .pipe(
    new PNG({
      filterType: 4,
    })
  )
  .on("parsed", function () {
    // (1) Spot beacons, near 10,90,50.
    let ply = fs.createWriteStream("foo.ply");
    let ply_count = 0;

//    console.log(l0.map(o => o.map(p => p / (100 * 100))));
    for (var y = 1100; y < this.height-250-600; y++) {
      for (var x = 150; x < this.width-200; x++) {
	var ix = this.width * y + x;
        var idx = (this.width * y + x) << 2;
	var r = this.data[idx];
	var g = this.data[idx+1];
	var b = this.data[idx+2];
//	r = Math.random() * 255;
//	g = Math.random() * 255;
//	b = Math.random() * 255;
	var c = convert.rgb.hsl(r,g,b);
	// -3.98861 -1.695612 11.12056 167 179 131 255
	if (Math.random() < 0.5) {
	  let pos = hslToPos(c[0],c[1],c[2]);
	  let d = distance([0.5,1.1],[pos[0],pos[2]]);
	  if (d < 1 && pos[1] > -3) {
	    r = 255;
	    g = 255;
	    b = 255;
	  }
	  ply.write(pos.map(o => o.toFixed(4)).join(" ") + " " + [r,g,b,255].map(o => o.toFixed(0)).join(" ") + "\n");
	  ply_count++;
	}
	c = convert.rgb.hsl(r,g,b);
	
        // invert color
	var i = c[0] * 2;
	var j = c[1] * 2;
	var what = 'wb';
	if (c[2] < 40) {
	  what = 'black';
	}
	var col;
	switch (what) {
	case 'wb':
	  col = [255,255,255];
	  break;
	case 'black':
	  col = [255,0,0];
	  break;
	default:
	  col = [0,0,0];
	  break;	  
	}

	col[0] = (distance([10,90,50],c) < 40)? 255:0;
	col[0] = 1 * c[0];
	col[1] = 1 * c[1];
	col[2] = 1 * c[2];
	col[0] /= 10;
/*	
	if (Math.abs(c[0] - 240) < 60 && c[1] < 50) {
	  col[0] = 0;
	  col[1] = 0;
	  col[2] = 255;
	}
*/

	// Force average scaling.
//	console.log(c[2],av);
//	c[2] /= (av * 2);
//	console.log("x",c[2],av);	
//	if (c[1] > 100) c[1] = 100;
	var rgb = convert.hsl.rgb(c[0],c[1],c[2]);
	col = rgb;
//	if (distance([28,c[2]*(av*2)],[c[1],c[2]]) < 10) {
//	  col[0] = 255;
//	  col[1] = 255;
//	  col[2] = 255;
//	}
/*	
	if (Math.abs(c[0] - 120) < 60 && c[1] < 50) {
	  col[0] = 0;
	  col[1] = 255;
	  col[2] = 0;
	}
*/
/*	
	if (Math.abs((c[0] + 360) % 360) < 60 && c[2] < 60) {
	  col[0] = 255;
	  col[1] = 0;
	  col[2] = 0;
	}
*/
        this.data[idx] = col[0];
        this.data[idx + 1] = col[1]; //255 - this.data[idx + 1];
        this.data[idx + 2] = col[2]; //255 - this.data[idx + 2];

        // and reduce opacity
        this.data[idx + 3] = 255; // this.data[idx + 3] >> 1;
      }
    }
//    console.log(l0);
    
    ply.end();
    ply = fs.createWriteStream("foo-header.ply");
    ply.write("ply\n");
    ply.write("format ascii 1.0\n");
    ply.write("comment VCGLIB generated\n");
    ply.write("element vertex " + ply_count + "\n");
    ply.write("property float x\n");
    ply.write("property float y\n");
    ply.write("property float z\n");
    ply.write("property uchar red\n");
    ply.write("property uchar green\n");
    ply.write("property uchar blue\n");
    ply.write("property uchar alpha\n");
    ply.write("element face 0\n");
    ply.write("property list uchar int vertex_indices\n");
    ply.write("end_header\n");
    ply.end();    
    
    this.pack().pipe(fs.createWriteStream("out.png"));

    
    let newPNG = new PNG({width:100, height: 100});
    newPNG.pack().pipe(fs.createWriteStream("out2.png"));    
  });
