function Create3DArray(rows, cols, height) {
  
  var arr = new Array(rows);
  
  for (var i = 0; i < rows; i++) {
    arr[i] = new Array(cols);
    for (var j = 0; j < cols; j++) {
      arr[i][j] = new Array(height);
    }
  }
  
  return arr;
}

  