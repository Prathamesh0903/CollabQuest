import java.util.*;
public class even{
    public static void main(String[] args) {
       try (Scanner sc=new Scanner(System.in)) {
           String target=sc.next();
           String ref=sc.next();

           for(int i=0;i<target.length();i++){
               for(int j=0;j<ref.length();j++){
                   if(ref.charAt(j)==target.charAt(i)){
                       char ch=target.charAt(i);
                       target= target.replace(ch,' ');
                   }
               }

           }
       }
    }
}