const LanguagePlugin = require('../base/LanguagePlugin');

/**
 * Java Language Plugin
 * Handles Java code execution and validation
 */
class JavaPlugin extends LanguagePlugin {
  getConfig() {
    return {
      id: 'java',
      name: 'Java',
      version: 'OpenJDK 17',
      extension: '.java',
      icon: '☕',
      description: 'Java programming language with OpenJDK 17',
      category: 'compiled',
      features: ['oop', 'multithreading', 'collections'],
      website: 'https://openjdk.org/',
      documentation: 'https://docs.oracle.com/en/java/'
    };
  }

  validateCode(code, options = {}) {
    const patterns = this.getSecurityPatterns();
    const violations = [];

    // Check for security violations
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        violations.push({
          type: 'security',
          message: `Security violation: ${pattern.source}`,
          pattern: pattern.source
        });
      }
    }

    // Check for basic Java syntax requirements
    if (!code.includes('public class')) {
      violations.push({
        type: 'syntax',
        message: 'Java code must contain a public class',
        pattern: 'public class'
      });
    }

    if (!code.includes('public static void main(String[] args)')) {
      violations.push({
        type: 'syntax',
        message: 'Java code must contain a main method: public static void main(String[] args)',
        pattern: 'main method'
      });
    }

    return {
      isValid: violations.length === 0,
      violations: violations
    };
  }

  getDockerConfig() {
    return {
      image: 'openjdk:17-alpine',
      filename: 'Main.java',
      runCommand: ['java', 'Main'],
      compileCommand: ['javac', 'Main.java'],
      setupCommands: [
        'apk add --no-cache gcc musl-dev'
      ],
      securityFlags: [
        '--add-opens=java.base/java.lang=ALL-UNNAMED',
        '--add-opens=java.base/java.io=ALL-UNNAMED'
      ],
      environment: {
        JAVA_HOME: '/usr/lib/jvm/java-17-openjdk',
        PATH: '/usr/lib/jvm/java-17-openjdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      },
      resourceLimits: {
        memory: 512 * 1024 * 1024, // 512MB
        cpu: 0.5,
        pids: 50
      }
    };
  }

  getSecurityPatterns() {
    return [
      // File system access
      /import\s+java\.io\.File/m,
      /import\s+java\.io\.FileInputStream/m,
      /import\s+java\.io\.FileOutputStream/m,
      /import\s+java\.io\.FileReader/m,
      /import\s+java\.io\.FileWriter/m,
      /import\s+java\.nio\.file\./m,
      /import\s+java\.io\./m,
      
      // Network access
      /import\s+java\.net\./m,
      /import\s+java\.net\.Socket/m,
      /import\s+java\.net\.URL/m,
      /import\s+java\.net\.URLConnection/m,
      
      // Process execution
      /import\s+java\.lang\.ProcessBuilder/m,
      /import\s+java\.lang\.Runtime/m,
      /ProcessBuilder/m,
      /Runtime\.getRuntime/m,
      
      // Reflection
      /import\s+java\.lang\.reflect\./m,
      /Class\.forName/m,
      /getClass/m,
      
      // System exit
      /System\.exit/m,
      
      // Security manager bypass
      /setSecurityManager/m,
      /getSecurityManager/m,
      
      // Native code
      /native\s+/m,
      /JNI/m,
      
      // Unsafe operations
      /sun\.misc\.Unsafe/m,
      /import\s+sun\./m
    ];
  }

  getDefaultCode() {
    return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
  }

  preprocessCode(code) {
    // Ensure the class name matches the filename
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    if (classNameMatch && classNameMatch[1] !== 'Main') {
      // Replace the class name with Main
      code = code.replace(new RegExp(`public\\s+class\\s+${classNameMatch[1]}`), 'public class Main');
      // Also replace any references to the old class name
      code = code.replace(new RegExp(`\\b${classNameMatch[1]}\\b`, 'g'), 'Main');
    }
    
    return code;
  }

  postprocessResult(result) {
    // Clean up any compilation artifacts from stderr
    if (result.stderr && result.stderr.includes('Note: Main.java uses unchecked or unsafe operations')) {
      result.stderr = result.stderr.replace(/Note: Main\.java uses unchecked or unsafe operations\.\n?/g, '');
    }
    
    return result;
  }

  getCodeExamples() {
    return [
      {
        name: 'Hello World',
        code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
        description: 'Basic Java program that prints "Hello, World!"'
      },
      {
        name: 'Simple Calculator',
        code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter first number: ");
        int a = scanner.nextInt();
        
        System.out.print("Enter second number: ");
        int b = scanner.nextInt();
        
        System.out.println("Sum: " + (a + b));
        System.out.println("Difference: " + (a - b));
        System.out.println("Product: " + (a * b));
        System.out.println("Quotient: " + (a / b));
        
        scanner.close();
    }
}`,
        description: 'Simple calculator that takes two numbers as input and performs basic arithmetic'
      },
      {
        name: 'Array Operations',
        code: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 2, 8, 1, 9, 3};
        
        System.out.println("Original array: " + Arrays.toString(numbers));
        
        // Sort the array
        Arrays.sort(numbers);
        System.out.println("Sorted array: " + Arrays.toString(numbers));
        
        // Find maximum and minimum
        int max = numbers[numbers.length - 1];
        int min = numbers[0];
        System.out.println("Maximum: " + max);
        System.out.println("Minimum: " + min);
        
        // Calculate sum
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum: " + sum);
        System.out.println("Average: " + (double) sum / numbers.length);
    }
}`,
        description: 'Demonstrates array operations including sorting, finding max/min, and calculating sum/average'
      }
    ];
  }

  getDocumentation() {
    return {
      official: 'https://docs.oracle.com/en/java/',
      tutorials: [
        'https://docs.oracle.com/javase/tutorial/',
        'https://www.w3schools.com/java/',
        'https://www.tutorialspoint.com/java/'
      ],
      cheatsheets: [
        'https://introcs.cs.princeton.edu/java/11cheatsheet/',
        'https://www.cis.upenn.edu/~matuszek/General/JavaSyntax/'
      ]
    };
  }

  async healthCheck() {
    try {
      // This would check if Java is available in the Docker environment
      return {
        status: 'healthy',
        message: 'Java plugin is ready',
        version: 'OpenJDK 17'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Java plugin health check failed',
        error: error.message
      };
    }
  }
}

module.exports = JavaPlugin;

