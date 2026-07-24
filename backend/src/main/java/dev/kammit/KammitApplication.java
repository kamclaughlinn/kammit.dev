package dev.kammit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KammitApplication {

    public static void main(String[] args) {
        SpringApplication.run(KammitApplication.class, args);
    }
}
