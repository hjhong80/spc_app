package com.spc.spc_back;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class SpcBackApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpcBackApplication.class, args);
	}

}
