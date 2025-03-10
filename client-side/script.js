let lastCanvas = null;
let undoStack = [];
let redoStack = [];
let erasingRemovesErasedObjects = false;

function saveState(hold=false) {
    if (hold) {
        lastCanvas = canvas.toJSON();
    } else {
        undoStack.push(lastCanvas);
        lastCanvas = canvas.toJSON();
    }
   redoStack = []; 
}

function undo() {
    if (undoStack.length > 0) {
        const prevState = lastCanvas = undoStack.pop();
        redoStack.push(canvas.toJSON()); 
        canvas.loadFromJSON(prevState, () => {
            canvas.renderAll();
        });
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = lastCanvas = redoStack.pop();
        undoStack.push(canvas.toJSON());
        canvas.loadFromJSON(nextState, () => {
            canvas.renderAll();
        });
    }
}


function changeAction(target) {
    document.querySelectorAll(".control-btns").forEach(element => {
        element.classList.remove('active');
    });
    if(typeof target==='string') target = document.getElementById(target);
    target.classList.add('active');
    switch (target.id) {
      case "select":
        canvas.isDrawingMode = false;
        break;
      case "erase":
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        updateBrushWidth("erase");
        canvas.isDrawingMode = true;
        break;
      case "undo-erasing":
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = 10;
        canvas.freeDrawingBrush.inverted = true;
        canvas.isDrawingMode = true;
        break;
      case "draw":
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        updateBrushWidth("draw");
        canvas.isDrawingMode = true;
        break;
      case "spray":
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        updateBrushWidth("spray");
        canvas.isDrawingMode = true;
        break;
      default:
        break;
    }
}


  function init() {
    // canvas.setOverlayColor("rgba(0,0,255,0.4)", undefined, {erasable: false});
    // canvas.renderAll();
    saveState(true);


    
    canvas.on("erasing:end", ({ targets, drawables }) => {
        if (erasingRemovesErasedObjects) {
            targets.forEach(obj => obj.group?.removeWithUpdate(obj) || canvas.remove(obj));
        }
    });

    canvas.on('path:created', (event) => {
        saveState();  
    });

    changeAction('draw');
  }



  
  const setDrawableErasableProp = (drawable, value) => {
    canvas.get(drawable)?.set({ erasable: value });
    changeAction('erase');
  };

//   const setBgImageErasableProp = (input) =>
//     setDrawableErasableProp("backgroundImage", input.checked);

  const setErasingRemovesErasedObjects = (input) =>
    (erasingRemovesErasedObjects = input.checked);

  const downloadImage = () => {
    const ext = "png";
    const base64 = canvas.toDataURL({
      format: ext,
      enableRetinaScaling: true
    });
    const link = document.createElement("a");
    link.href = base64;
    link.download = `eraser_example.${ext}`;
    link.click();
  };

  const downloadSVG = () => {
    const svg = canvas.toSVG();
    const a = document.createElement("a");
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const blobURL = URL.createObjectURL(blob);
    a.href = blobURL;
    a.download = "eraser_example.svg";
    a.click();
    URL.revokeObjectURL(blobURL);
  };

  const toJSON = async () => {
    const json = canvas.toDatalessJSON(["clipPath", "eraser"]);
    const out = JSON.stringify(json, null, "\t");
    const blob = new Blob([out], { type: "text/plain" });
    const clipboardItemData = { [blob.type]: blob };
    try {
      navigator.clipboard &&
        (await navigator.clipboard.write([
          new ClipboardItem(clipboardItemData)
        ]));
    } catch (error) {
      console.log(error);
    }
    const blobURL = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobURL;
    a.download = "eraser_example.json";
    a.click();
    URL.revokeObjectURL(blobURL);
  };

  function updateBrushWidth(elementName) {
    const value = document.getElementById(`brushWidthSlider-${elementName}`).value;
    canvas.freeDrawingBrush.width = parseInt(value);
    document.getElementById(`brushWidthValue-${elementName}`).textContent = value;
}


  const canvas = this.__canvas = new fabric.Canvas('c');
  init();


  document.getElementById('saveButton').addEventListener('click', function() {
    const data = {
        canvas: canvas.toJSON(),
    };

    fetch('./save-data', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


document.addEventListener('DOMContentLoaded', function() {
    function loadData() {
        fetch('./load-data')
        .then(response => response.json())
        .then(data => {
            canvas.loadFromJSON(data, () => {
		saveState();
                canvas.renderAll();
                console.log('Canvas has been updated from server data.');
            });
        })
        .catch(error => console.error('Error loading data:', error));
    }

    loadData();
});
