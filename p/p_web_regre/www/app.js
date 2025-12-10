let session = null;
let currentModel = null;

// Diccionario de etiquetas amigables
const modelLabels = {
  "best_frec_model.onnx": "Modelo Frecuentista",
  "best_bayes_model.onnx": "Modelo Bayesiano"
};

// --- Cargar modelo ONNX dinámicamente ---
async function loadModel(modelPath) {
  document.getElementById("status").innerText = "Cargando modelo... ";
  session = await ort.InferenceSession.create(modelPath);
  currentModel = modelPath;
  document.getElementById("status").innerText = `Modelo cargado ✅\n ${modelLabels[modelPath]}`;
}

// --- Parámetros del StandardScaler obtenidos de Python ---
const means = [39.1317757, 30.75229439, 1.10654206];   // age, bmi, children
const scales = [14.03135406, 5.99344767, 1.20971697];

function standardize(value, mean, scale) {
  return (value - mean) / scale;
}

// --- Preprocesamiento replicando ColumnTransformer ---
function preprocessInput(age, sex, bmi, children, smoker, region) {
  const age_scaled = standardize(age, means[0], scales[0]);
  const bmi_scaled = standardize(bmi, means[1], scales[1]);
  const children_scaled = standardize(children, means[2], scales[2]);

  const sex_female = sex === "female" ? 1 : 0;
  const sex_male   = sex === "male" ? 1 : 0;

  const smoker_no  = smoker === "no" ? 1 : 0;
  const smoker_yes = smoker === "yes" ? 1 : 0;

  const region_ne = region === "northeast" ? 1 : 0;
  const region_nw = region === "northwest" ? 1 : 0;
  const region_se = region === "southeast" ? 1 : 0;
  const region_sw = region === "southwest" ? 1 : 0;

  return Float32Array.from([
    age_scaled, bmi_scaled, children_scaled,
    sex_female, sex_male,
    smoker_no, smoker_yes,
    region_ne, region_nw, region_se, region_sw
  ]);
}

// --- Predicción ---
async function predict(event) {
  event.preventDefault();

  const age = parseFloat(document.getElementById("age").value);
  const sex = document.getElementById("sex").value;
  const bmi = parseFloat(document.getElementById("bmi").value);
  const children = parseInt(document.getElementById("children").value);
  const smoker = document.getElementById("smoker").value;
  const region = document.getElementById("region").value;

  const modelPath = document.getElementById("modelChoice").value;

  // Cargar el modelo seleccionado si aún no está cargado
  if (!session || currentModel !== modelPath) {
    await loadModel(modelPath);
  }

  const inputTensor = preprocessInput(age, sex, bmi, children, smoker, region);
  const tensor = new ort.Tensor("float32", inputTensor, [1, inputTensor.length]);
  const feeds = { float_input: tensor };

  const results = await session.run(feeds);
  const output = results[Object.keys(results)[0]].data[0];

  document.getElementById("result").innerText = 
    `${modelLabels[modelPath]} → \n Cargo Predicho: $${output.toFixed(2)}`;
}

// --- Listener del formulario ---
document.getElementById("predictForm").addEventListener("submit", predict);

// --- Cargar modelo por defecto al inicio ---
window.addEventListener("load", () => loadModel("best_frec_model.onnx"));
