
void setup() {
  Table table = loadTable("allcomments2.tsv");
  String[] comments = table.getStringColumn(2);
  saveStrings("comments.txt", comments);
  
}